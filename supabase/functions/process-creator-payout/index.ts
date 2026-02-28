import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-08-16',
})

interface PayoutRequest {
  destination_account: string
  amount: number
  currency: string
  giveaway_id: string
  description?: string
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { 
      destination_account, 
      amount, 
      currency, 
      giveaway_id, 
      description 
    }: PayoutRequest = await req.json()

    // Validate required fields
    if (!destination_account || !amount || !currency || !giveaway_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate amount (minimum $1.00)
    if (amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Minimum payout amount is $1.00' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify the destination account exists and is valid
    try {
      const account = await stripe.accounts.retrieve(destination_account)
      
      if (!account.charges_enabled || !account.payouts_enabled) {
        return new Response(
          JSON.stringify({ error: 'Destination account is not enabled for payouts' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (error) {
      console.error('Account verification error:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid destination account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create the transfer to the creator's Connect account
    const transfer = await stripe.transfers.create({
      amount,
      currency,
      destination: destination_account,
      description: description || `Creator payout for giveaway ${giveaway_id}`,
      metadata: {
        giveaway_id,
        payout_type: 'creator_revenue',
        processed_at: new Date().toISOString(),
      },
    })

    console.log('Transfer created:', transfer.id)

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
        status: transfer.status,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Creator payout error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
