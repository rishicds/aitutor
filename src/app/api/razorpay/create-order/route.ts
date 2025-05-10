import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

// Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in your .env.local
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Razorpay API Keys are not configured in environment variables.");
  // You might want to throw an error here or handle it as per your app's needs
}

const razorpayInstance = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR', packageId, packageName, tokens, userId } = await request.json();

    if (!amount || !packageId || !packageName || !tokens || !userId) {
      return NextResponse.json({ error: 'Missing required fields for order creation.' }, { status: 400 });
    }

    const options = {
      amount: Number(amount), // Amount in the smallest currency unit (e.g., paisa for INR)
      currency,
      receipt: `receipt_${packageId}_${userId.substring(0,5)}_${randomBytes(4).toString('hex')}`, // Shortened receipt
      notes: {
        packageId,
        packageName,
        tokens: String(tokens), // Ensure notes are strings if required by Razorpay or your logic
        userId,
        description: `Token purchase: ${packageName} for user ${userId}`,
      },
    };

    console.log("Creating Razorpay order with options:", options);
    const order = await razorpayInstance.orders.create(options);
    console.log("Razorpay order created:", order);


    if (!order) {
      console.error("Razorpay order creation returned null or undefined.");
      return NextResponse.json({ error: 'Failed to create Razorpay order (Razorpay returned no order).' }, { status: 500 });
    }
    // It seems Razorpay SDK might wrap errors differently, or the order object itself might contain an error field
    // For instance, if keys are wrong, it might throw an error caught by the catch block.
    // If it returns an order object with an 'error' property (less common for create):
    // if (order.error) {
    //     console.error("Razorpay order creation failed with error:", order.error);
    //     return NextResponse.json({ error: 'Failed to create Razorpay order.', details: order.error.description }, { status: 500 });
    // }


    return NextResponse.json(order, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    const errorMessage = error.message || 'Internal Server Error while creating order.';
    // Check for Razorpay specific error structure if the SDK throws structured errors
    if (error.statusCode && error.error && error.error.description) {
        return NextResponse.json(
          { error: `Razorpay Error: ${error.error.description}`, details: error.error },
          { status: error.statusCode || 500 }
        );
    }
    return NextResponse.json(
      { error: errorMessage, details: error.stack }, // Include stack in dev for easier debugging
      { status: 500 }
    );
  }
} 