import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.8.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessPayoutRequest {
  giveawayId: string
  winnerId: string
  payoutType: 'winner_prize' | 'creator_revenue' | 'refund'
  amount?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { giveawayId, winnerId, payoutType, amount }: ProcessPayoutRequest = await req.json()

    // Get giveaway details
    const { data: giveaway, error: giveawayError } = await supabase
      .from('giveaways')
      .select('*')
      .eq('id', giveawayId)
      .single()

    if (giveawayError || !giveaway) {
      throw new Error('Giveaway not found')
    }

    // Verify user has permission to process payout
    if (giveaway.creator_id !== user.id && payoutType !== 'refund') {
      // Check if user is admin for refunds
      const { data: userData } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (!userData?.is_admin) {
        throw new Error('Unauthorized to process payout')
      }
    }

    // Get escrow account
    const { data: escrowAccount, error: escrowError } = await supabase
      .from('escrow_accounts')
      .select('*')
      .eq('giveaway_id', giveawayId)
      .single()

    if (escrowError || !escrowAccount) {
      throw new Error('Escrow account not found')
    }

    // Get winner details
    const { data: winner, error: winnerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', winnerId)
      .single()

    if (winnerError || !winner) {
      throw new Error('Winner not found')
    }

    // Calculate payout amount
    let payoutAmount: number
    if (amount) {
      payoutAmount = amount
    } else if (payoutType === 'winner_prize') {
      payoutAmount = giveaway.cash_prize_amount || escrowAccount.available_amount
    } else if (payoutType === 'creator_revenue') {
      // Calculate creator revenue (total entry fees minus platform commission)
      payoutAmount = escrowAccount.available_amount * 0.9 // 90% to creator
    } else {
      throw new Error('Amount required for this payout type')
    }

    // Verify sufficient funds
    if (payoutAmount > escrowAccount.available_amount) {
      throw new Error('Insufficient funds in escrow')
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        recipient_id: winnerId,
        giveaway_id: giveawayId,
        escrow_account_id: escrowAccount.id,
        payout_type: payoutType,
        amount: payoutAmount,
        currency: 'USD',
        initiated_by: user.id
      })
      .select()
      .single()

    if (payoutError) {
      throw new Error(`Failed to create payout record: ${payoutError.message}`)
    }

    try {
      // Create Stripe transfer if winner has connected account
      let stripeTransferId: string | null = null
      
      if (winner.stripe_account_id && winner.stripe_account_enabled) {
        const transfer = await stripe.transfers.create({
          amount: Math.round(payoutAmount * 100), // Convert to cents
          currency: 'usd',
          destination: winner.stripe_account_id,
          metadata: {
            payout_id: payout.id,
            giveaway_id: giveawayId,
            payout_type: payoutType
          }
        })
        
        stripeTransferId = transfer.id
      } else {
        // Handle manual payout - create pending payout for manual processing
        console.log(`Manual payout required for user ${winnerId} - no connected Stripe account`)
      }

      // Update payout with Stripe transfer ID
      const { error: updateError } = await supabase
        .from('payouts')
        .update({
          stripe_transfer_id: stripeTransferId,
          status: stripeTransferId ? 'processing' : 'pending',
          stripe_account_id: winner.stripe_account_id
        })
        .eq('id', payout.id)

      if (updateError) {
        throw new Error(`Failed to update payout: ${updateError.message}`)
      }

      // Update escrow account balance
      const { error: escrowUpdateError } = await supabase
        .from('escrow_accounts')
        .update({
          available_amount: escrowAccount.available_amount - payoutAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowAccount.id)

      if (escrowUpdateError) {
        throw new Error(`Failed to update escrow balance: ${escrowUpdateError.message}`)
      }

      // Create transaction ledger entry
      const { error: ledgerError } = await supabase
        .from('transaction_ledger')
        .insert({
          payment_id: payout.id,
          escrow_account_id: escrowAccount.id,
          debit_amount: payoutAmount,
          balance_after: escrowAccount.available_amount - payoutAmount,
          description: `${payoutType} payout to ${winner.email}`,
          reference_type: payoutType,
          reference_id: giveawayId
        })

      if (ledgerError) {
        console.error('Failed to create ledger entry:', ledgerError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          payout_id: payout.id,
          stripe_transfer_id: stripeTransferId,
          amount: payoutAmount,
          status: stripeTransferId ? 'processing' : 'pending'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } catch (stripeError) {
      // If Stripe transfer fails, mark payout as failed
      await supabase
        .from('payouts')
        .update({
          status: 'failed',
          failure_reason: stripeError.message
        })
        .eq('id', payout.id)

      throw new Error(`Stripe transfer failed: ${stripeError.message}`)
    }

  } catch (error) {
    console.error('Payout processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
