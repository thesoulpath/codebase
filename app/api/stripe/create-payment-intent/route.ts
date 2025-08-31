import { NextRequest, NextResponse } from 'next/server';

// Build-time check - prevent Stripe imports during build
let StripePaymentService: any;

if (process.env.NODE_ENV !== 'production' || process.env.STRIPE_SECRET_KEY) {
  const paymentModule = require('@/lib/stripe/payment-service');
  StripePaymentService = paymentModule.StripePaymentService;
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
  if (!StripePaymentService) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      amount,
      currency,
      customerEmail,
      customerId,
      metadata,
      description,
    } = body;

    // Validate required fields
    if (!amount || !currency || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment intent
    const result = await StripePaymentService.createPaymentIntent({
      amount, // Amount in cents
      currency: currency.toLowerCase(),
      customerId,
      customerEmail,
      metadata: {
        ...metadata,
        source: 'soulpath_payment_intent',
        timestamp: new Date().toISOString(),
      },
      description,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
