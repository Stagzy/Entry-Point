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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, email, country = 'US', type = 'express' } = await req.json()

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: 'user_id and email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user already has a Stripe Connect account
    const { data: existingAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id, onboarding_completed')
      .eq('user_id', user_id)
      .single()

    if (existingAccount?.stripe_account_id && existingAccount.onboarding_completed) {
      return new Response(
        JSON.stringify({ 
          account_id: existingAccount.stripe_account_id,
          onboarding_completed: true 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let accountId = existingAccount?.stripe_account_id

    // Create new Stripe Connect Express account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'manual', // Platform controls payouts
            },
          },
        },
      })

      accountId = account.id

      // Store in database
      await supabase
        .from('stripe_connect_accounts')
        .upsert({
          user_id: user_id,
          stripe_account_id: accountId,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
        })
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get('origin')}/creator/onboarding/refresh`,
      return_url: `${req.headers.get('origin')}/creator/onboarding/success`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({
        account_id: accountId,
        onboarding_url: accountLink.url,
        onboarding_completed: false,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Stripe Connect account creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
