// Stripe Webhook Handler - Updates user paid status after successful payment
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body for signature verification
  },
};

// Initialize Supabase client for serverless function
const getSupabase = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Verify Stripe webhook signature
const verifyStripeSignature = (payload, signature, secret) => {
  const elements = signature.split(',');
  const signatureData = {};

  elements.forEach(element => {
    const [key, value] = element.split('=');
    signatureData[key] = value;
  });

  const timestamp = signatureData.t;
  const expectedSignature = signatureData.v1;

  if (!timestamp || !expectedSignature) {
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    );
  } catch {
    return false;
  }
};

// Get raw body from request
const getRawBody = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
};

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('No Stripe signature header');
      return res.status(400).json({ error: 'No signature' });
    }

    // Verify webhook signature
    const isValid = verifyStripeSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid Stripe webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse the event
    const event = JSON.parse(rawBody);
    console.log('Stripe webhook event:', event.type);

    // Handle successful checkout/payment events
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'payment_intent.succeeded'
    ) {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.receipt_email;

      if (!customerEmail) {
        console.log('No customer email in event, checking metadata...');
        // Try to get email from metadata if set during checkout
        const email = session.metadata?.email;
        if (!email) {
          console.error('No email found in webhook event');
          return res.status(200).json({ received: true, warning: 'No email found' });
        }
      }

      const email = customerEmail || session.metadata?.email;
      console.log('Processing payment for:', email);

      // Update user's paid status in Supabase
      try {
        const supabase = getSupabase();

        const { error } = await supabase
          .from('collected_emails')
          .update({
            is_paid: true,
            paid_at: new Date().toISOString(),
            stripe_customer_id: session.customer || null,
            stripe_payment_id: session.payment_intent || session.id,
          })
          .eq('email', email.toLowerCase());

        if (error) {
          console.error('Supabase update error:', error);
          // Still return 200 to Stripe to prevent retries
          return res.status(200).json({ received: true, error: error.message });
        }

        console.log('Successfully updated paid status for:', email);
        return res.status(200).json({ received: true, updated: email });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(200).json({ received: true, error: dbError.message });
      }
    }

    // For other event types, just acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: error.message });
  }
}
