import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Build-time check - prevent Stripe imports during build
let getStripe: any;
let stripeConfig: any;

if (process.env.NODE_ENV !== 'production' || process.env.STRIPE_SECRET_KEY) {
  const stripeModule = require('@/lib/stripe/config');
  getStripe = stripeModule.getStripe;
  stripeConfig = stripeModule.stripeConfig;
}

export async function POST(request: NextRequest) {
  // Build-time check - prevent execution during build
  if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  // Runtime check - ensure Stripe is available
  if (!getStripe || !stripeConfig) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, stripeConfig.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerClient();

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabase);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabase);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any, supabase: any) {
  console.log('Checkout session completed:', session.id);

  try {
    // Extract customer information
    const customerEmail = session.customer_details?.email;
    const amount = session.amount_total;
    const currency = session.currency;
    const metadata = session.metadata;

    if (customerEmail && amount) {
      // Create or update payment record
      const { error } = await supabase
        .from('payment_records')
        .insert({
          client_id: metadata?.client_id,
          amount: amount / 100, // Convert from cents
          currency_id: await getCurrencyId(currency, supabase),
          payment_method: 'stripe',
          payment_status: 'completed',
          transaction_id: session.id,
          notes: `Stripe checkout completed - ${metadata?.description || 'Payment'}`,
          metadata: {
            stripe_session_id: session.id,
            stripe_customer_id: session.customer,
            ...metadata,
          },
        });

      if (error) {
        console.error('Error creating payment record:', error);
      }
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: any) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  try {
    // Update payment record status
    const { error } = await supabase
      .from('payment_records')
      .update({
        payment_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', paymentIntent.id);

    if (error) {
      console.error('Error updating payment record:', error);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any, supabase: any) {
  console.log('Payment intent failed:', paymentIntent.id);

  try {
    // Update payment record status
    const { error } = await supabase
      .from('payment_records')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', paymentIntent.id);

    if (error) {
      console.error('Error updating payment record:', error);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleSubscriptionCreated(subscription: any, _supabase: any) {
  console.log('Subscription created:', subscription.id);
  // Handle subscription creation logic
}

async function handleSubscriptionUpdated(subscription: any, _supabase: any) {
  console.log('Subscription updated:', subscription.id);
  // Handle subscription update logic
}

async function handleSubscriptionDeleted(subscription: any, _supabase: any) {
  console.log('Subscription deleted:', subscription.id);
  // Handle subscription deletion logic
}

async function getCurrencyId(currencyCode: string, supabase: any): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('currencies')
      .select('id')
      .eq('code', currencyCode.toUpperCase())
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting currency ID:', error);
    return null;
  }
}
