import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email service integration (using a service like Resend, SendGrid, etc.)
async function sendReceiptEmail(to: string, receiptData: any) {
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .receipt-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .receipt-details { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; }
        .amount { font-size: 24px; font-weight: bold; color: #4F46E5; }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <h1>🎉 Entry Point Receipt</h1>
          <p>Thank you for your purchase!</p>
        </div>
        
        <div class="receipt-details">
          <h2>Purchase Details</h2>
          <p><strong>Giveaway:</strong> ${receiptData.giveawayTitle}</p>
          <p><strong>Quantity:</strong> ${receiptData.ticketCount} ticket(s)</p>
          <p><strong>Amount:</strong> <span class="amount">$${receiptData.amount}</span></p>
          <p><strong>Payment Method:</strong> •••• ${receiptData.last4}</p>
          <p><strong>Date:</strong> ${new Date(receiptData.purchaseDate).toLocaleDateString()}</p>
          <p><strong>Order ID:</strong> ${receiptData.orderId}</p>
        </div>
        
        <div class="receipt-details">
          <h3>🎯 Your Entries</h3>
          <p>You now have ${receiptData.ticketCount} entries in this giveaway!</p>
          <p>Good luck! 🍀</p>
        </div>
        
        <div class="footer">
          <p><a href="${receiptData.rulesUrl}" target="_blank">📋 Official Rules</a></p>
          <p>Questions? Contact us at support@entrypoint.com</p>
          <p>Entry Point - Making giveaways fair and fun</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // This would integrate with your chosen email service
  // For now, we'll log it and store in database
  console.log('Email would be sent to:', to);
  console.log('Receipt HTML generated');
  
  return { success: true, emailId: `mock_${Date.now()}` };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, paymentIntentId } = await req.json()

    if (!orderId && !paymentIntentId) {
      return new Response(
        JSON.stringify({ error: 'orderId or paymentIntentId required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get order details
    let orderQuery = supabase
      .from('orders')
      .select(`
        *,
        user:users!user_id(email, name),
        giveaway:giveaways!giveaway_id(title, official_rules_url),
        entries:entries!order_id(*)
      `)

    if (orderId) {
      orderQuery = orderQuery.eq('id', orderId)
    } else {
      orderQuery = orderQuery.eq('stripe_payment_intent_id', paymentIntentId)
    }

    const { data: order, error: orderError } = await orderQuery.single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (order.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Order not completed yet' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if receipt already exists
    const { data: existingReceipt } = await supabase
      .from('receipts')
      .select('*')
      .eq('order_id', order.id)
      .single()

    if (existingReceipt) {
      return new Response(
        JSON.stringify({
          receipt: existingReceipt,
          message: 'Receipt already exists'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get payment method details (last 4 digits)
    // This would typically come from Stripe payment method
    const last4 = order.payment_metadata?.last4 || '****';

    // Prepare receipt data
    const receiptData = {
      orderId: order.id,
      giveawayTitle: order.giveaway.title,
      ticketCount: order.ticket_count,
      amount: order.total_amount.toFixed(2),
      last4: last4,
      purchaseDate: order.payment_completed_at,
      rulesUrl: order.giveaway.official_rules_url || '#',
      userEmail: order.user.email,
      userName: order.user.name
    };

    // Send email receipt
    const emailResult = await sendReceiptEmail(order.user.email, receiptData);

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        order_id: order.id,
        user_id: order.user_id,
        email_sent_to: order.user.email,
        receipt_data: receiptData,
        email_service_id: emailResult.emailId,
        generated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (receiptError) {
      console.error('Failed to create receipt record:', receiptError);
    }

    // Generate in-app receipt data
    const inAppReceipt = {
      id: receipt?.id || `temp_${Date.now()}`,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      giveaway: {
        title: order.giveaway.title,
        rulesUrl: order.giveaway.official_rules_url
      },
      purchase: {
        ticketCount: order.ticket_count,
        amount: order.total_amount,
        currency: order.currency,
        date: order.payment_completed_at
      },
      payment: {
        last4: last4,
        paymentMethod: 'Card ending in ' + last4
      },
      entries: order.entries.length > 0 ? order.entries : [{
        id: 'generated',
        ticket_count: order.ticket_count,
        status: 'entered'
      }]
    };

    return new Response(
      JSON.stringify({
        success: true,
        receipt: inAppReceipt,
        emailSent: emailResult.success,
        receiptId: receipt?.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Receipt generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
