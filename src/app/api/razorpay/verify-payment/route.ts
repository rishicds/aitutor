import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// --- Firebase Admin Setup ---
let adminApp: App;
if (!getApps().length) {
  const firebaseAdminConfigEnv = process.env.FIREBASE_ADMIN_CONFIG;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let cred;
  if (firebaseAdminConfigEnv) {
    try {
      cred = cert(JSON.parse(firebaseAdminConfigEnv));
    } catch (e) {
      console.error("Failed to parse FIREBASE_ADMIN_CONFIG:", e);
    }
  } else if (serviceAccountPath) {
    cred = cert(serviceAccountPath);
  }

  if (cred) {
    adminApp = initializeApp({ credential: cred }, "firebaseAdminSDKInstance_" + Date.now()); // Unique name
  } else {
    console.error(
      "Firebase Admin SDK not initialized. Missing or invalid FIREBASE_ADMIN_CONFIG or GOOGLE_APPLICATION_CREDENTIALS environment variable."
    );
    // This API route will not function correctly without Firebase Admin
  }
} else {
  adminApp = getApps().find(app => app.name.startsWith("firebaseAdminSDKInstance_")) || getApps()[0];
}

const adminDb = getFirestore(adminApp);
// --- End Firebase Admin Setup ---


export async function POST(request: Request) {
  if (!adminApp) { // Check if Firebase Admin was initialized
      return NextResponse.json(
          { error: 'Server configuration error: Firebase Admin not initialized. Payment cannot be verified.' },
          { status: 500 }
      );
  }
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      userId,
      tokensToAdd,
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !userId || !tokensToAdd) {
      return NextResponse.json({ error: 'Missing required fields for payment verification.' }, { status: 400 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!) // Ensure RAZORPAY_KEY_SECRET is set
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      console.log(`Payment verified for order ${razorpay_order_id}. Attempting to update tokens for user ${userId}.`);
      try {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({
          tokens: FieldValue.increment(Number(tokensToAdd)),
          lastPurchasedPackageOrderId: razorpay_order_id,
          lastPurchaseDate: FieldValue.serverTimestamp(),
        });
        console.log(`Successfully updated tokens for user ${userId}. Tokens added: ${tokensToAdd}`);

        // Optional: Store transaction details for auditing
        // await adminDb.collection('transactions').add({
        //   userId,
        //   orderId: razorpay_order_id,
        //   paymentId: razorpay_payment_id,
        //   tokens: Number(tokensToAdd),
        //   status: 'success',
        //   verifiedAt: FieldValue.serverTimestamp(),
        // });

        return NextResponse.json({ verified: true, message: 'Payment verified and tokens updated.' }, { status: 200 });

      } catch (dbError: any) {
        console.error(`Firestore update error for user ${userId}, order ${razorpay_order_id}:`, dbError);
        return NextResponse.json(
          { verified: true, message: 'Payment verified but failed to update tokens in database. Please contact support.', error: dbError.message },
          { status: 500 }
        );
      }
    } else {
      console.warn(`Invalid payment signature for order ${razorpay_order_id}.`);
      return NextResponse.json({ verified: false, error: 'Invalid payment signature.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during payment verification.', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 