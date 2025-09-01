import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createEmailService } from '@/lib/brevo-email-service';

export async function GET() {
  // This endpoint requires authentication for all methods
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, paymentMethodId, quantity = 1 } = body;

    if (!packageId || !paymentMethodId) {
      return NextResponse.json({ error: 'Package ID and payment method are required' }, { status: 400 });
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('soul_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Get payment method details
    const { data: paymentMethod, error: paymentMethodError } = await supabase
      .from('payment_methods')
      .select(`
        *,
        currencies:currency_id(
          id,
          code,
          symbol,
          name
        )
      `)
      .eq('id', paymentMethodId)
      .single();

    if (paymentMethodError || !paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Calculate total amount
    const totalAmount = packageData.price * quantity;

    // Create purchase record
    const { data: purchaseRecord, error: purchaseError } = await supabase
      .from('purchase_records')
      .insert({
        client_id: user.id,
        package_id: packageId,
        payment_method: paymentMethodId,
        amount: totalAmount,
        quantity: quantity,
        status: 'pending',
        currency_id: paymentMethod.currency_id
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
      return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 });
    }

    // Get email template
    const { data: emailTemplate, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'purchase_confirmation')
      .single();

    if (!templateError && emailTemplate) {
      // Prepare email replacements
      const replacements = {
        client_name: user.user_metadata?.full_name || user.email,
        package_name: packageData.name,
        quantity: quantity.toString(),
        total_amount: `${paymentMethod.currencies.symbol}${totalAmount}`,
        payment_method: paymentMethod.name,
        purchase_date: new Date().toLocaleDateString()
      };

      // Send email using Brevo API with database template
      let emailSent = false;
      const emailService = await createEmailService();
      if (emailService) {
        emailSent = await emailService.sendTemplateEmail(
          user.email || '',
          emailTemplate.body,
          emailTemplate.subject,
          replacements
        );
      }

      if (emailSent) {
        console.log('Purchase confirmation email sent successfully');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        purchase: purchaseRecord,
        package: packageData,
        paymentMethod: paymentMethod,
        totalAmount: totalAmount
      },
      message: 'Purchase created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/client/purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
