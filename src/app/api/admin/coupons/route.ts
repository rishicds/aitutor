import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, Firestore } from 'firebase-admin/firestore';

interface CouponData {
  id?: string;
  code?: string; // Present if fetched with ID as doc.id
  discountPercentage: number;
  isActive: boolean;
  validFrom?: Timestamp | string; // Allow ISO string for input, Timestamp for storage/output
  validUntil?: Timestamp | string;
  maxUses?: number;
  uses: number;
  minPurchaseAmount?: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// --- Firebase Admin Setup ---
let adminApp: App | undefined = undefined;
let adminDb: Firestore | undefined = undefined;

if (!getApps().length) {
  const firebaseAdminConfigEnv = process.env.FIREBASE_ADMIN_CONFIG;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let cred;
  if (firebaseAdminConfigEnv) {
    try { cred = cert(JSON.parse(firebaseAdminConfigEnv)); } catch (e) { console.error("Failed to parse FIREBASE_ADMIN_CONFIG:", e); }
  } else if (serviceAccountPath) {
    try { cred = cert(serviceAccountPath); } catch (e) { console.error("Failed to parse serviceAccountPath:", e); }
  }
  if (cred) {
    adminApp = initializeApp({ credential: cred }, "adminCouponAPI_" + Date.now());
    adminDb = getFirestore(adminApp);
  } else {
    console.error("Firebase Admin SDK for Coupon API not initialized. Credentials missing or invalid.");
  }
} else {
  adminApp = getApps().find(app => app.name.startsWith("adminCouponAPI_")) || getApps()[0];
  if (adminApp) adminDb = getFirestore(adminApp);
}
// --- End Firebase Admin Setup ---

// Placeholder for admin check
// async function isAdmin(request: Request): Promise<boolean> { // request might be needed for token
//   console.warn("WARN: Admin check is currently a placeholder. Implement proper security.");
//   return true; 
// }

// GET: Fetch all coupons
export async function GET(_request: Request) { // _request to indicate it's not used yet
  if (!adminDb) return NextResponse.json({ error: 'Server configuration error: Database not available.' }, { status: 500 });
  // if (!await isAdmin(request)) { // Uncomment when isAdmin is implemented
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const couponsSnapshot = await adminDb.collection('coupons').orderBy('createdAt', 'desc').get();
    const coupons: CouponData[] = couponsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            code: doc.id, // Assuming code is the document ID
            discountPercentage: data.discountPercentage,
            isActive: data.isActive,
            uses: data.uses,
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date(0).toISOString(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date(0).toISOString(),
            ...(data.validFrom && { validFrom: (data.validFrom as Timestamp)?.toDate().toISOString() }),
            ...(data.validUntil && { validUntil: (data.validUntil as Timestamp)?.toDate().toISOString() }),
            ...(typeof data.maxUses === 'number' && { maxUses: data.maxUses }),
            ...(typeof data.minPurchaseAmount === 'number' && { minPurchaseAmount: data.minPurchaseAmount }),
        } as CouponData;
    });
    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching coupons:', err);
    return NextResponse.json({ error: 'Failed to fetch coupons.', details: err.message }, { status: 500 });
  }
}

// POST: Create a new coupon
export async function POST(request: Request) {
  if (!adminDb) return NextResponse.json({ error: 'Server configuration error: Database not available.' }, { status: 500 });
  // if (!await isAdmin(request)) { // Uncomment when isAdmin is implemented
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const body = await request.json();
    const { 
      code, 
      discountPercentage, 
      isActive = true, 
      validFrom, 
      validUntil, 
      maxUses,
      minPurchaseAmount 
    } = body as Partial<CouponData>; // Use Partial for input as some fields are optional

    if (!code || typeof discountPercentage !== 'number' || discountPercentage <= 0 || discountPercentage > 100) {
      return NextResponse.json({ error: 'Invalid coupon data. Code (string) and valid discountPercentage (number) are required.' }, { status: 400 });
    }

    const couponId = code.trim().toUpperCase();
    const couponRef = adminDb.collection('coupons').doc(couponId);
    const docSnapshot = await couponRef.get();

    if (docSnapshot.exists) {
      return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 409 });
    }

    const newCouponData: Omit<CouponData, 'id' | 'code'> = {
      discountPercentage: Number(discountPercentage),
      isActive: Boolean(isActive),
      uses: 0,
      createdAt: FieldValue.serverTimestamp() as unknown as Timestamp, // Firestore specific type
      updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    };

    if (validFrom && typeof validFrom === 'string') newCouponData.validFrom = Timestamp.fromDate(new Date(validFrom));
    if (validUntil && typeof validUntil === 'string') newCouponData.validUntil = Timestamp.fromDate(new Date(validUntil));
    if (typeof maxUses === 'number' && maxUses > 0) newCouponData.maxUses = Number(maxUses);
    if (typeof minPurchaseAmount === 'number' && minPurchaseAmount >= 0) newCouponData.minPurchaseAmount = Number(minPurchaseAmount);
    
    await couponRef.set(newCouponData);

    const createdCouponForReturn: CouponData = {
        id: couponId,
        code: couponId,
        ...newCouponData,
        // Approximate server timestamps for immediate return if needed, or fetch the doc again
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        ...(newCouponData.validFrom instanceof Timestamp && { validFrom: newCouponData.validFrom.toDate().toISOString() }),
        ...(newCouponData.validUntil instanceof Timestamp && { validUntil: newCouponData.validUntil.toDate().toISOString() }),
    };

    return NextResponse.json(createdCouponForReturn, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating coupon:', err);
    if (err.message.includes("Invalid Date")) {
        return NextResponse.json({ error: 'Invalid date format for validFrom or validUntil. Please use ISO 8601 format.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create coupon.', details: err.message }, { status: 500 });
  }
}

// PUT: Update a coupon (e.g., toggle isActive)
// File Path: src/app/api/admin/coupons/[couponId]/route.ts
// For now, this will be a separate file for PUT/DELETE specific to a couponId for RESTfulness.
// This route.ts will only handle GET all and POST new. 