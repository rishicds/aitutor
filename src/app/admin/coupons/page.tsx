"use client";

import { useState, useEffect, FormEvent } from 'react';

interface Coupon {
  id: string; // Document ID from Firestore, which is the coupon code
  discountPercentage: number;
  isActive: boolean;
  validFrom?: string; // ISO string date
  validUntil?: string; // ISO string date
  maxUses?: number;
  uses: number;
  minPurchaseAmount?: number;
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
}

interface NewCouponFormState {
  code: string;
  discountPercentage: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  maxUses?: string;
  minPurchaseAmount?: string;
}

interface CouponApiPayload {
    code: string;
    discountPercentage: number;
    isActive: boolean;
    validFrom?: string;
    validUntil?: string;
    maxUses?: number;
    minPurchaseAmount?: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCoupon, setNewCoupon] = useState<NewCouponFormState>({
    code: '',
    discountPercentage: '',
    isActive: true,
    validFrom: '',
    validUntil: '',
    maxUses: '',
    minPurchaseAmount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/coupons');
      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to fetch coupons');
      }
      const data: Coupon[] = await response.json();
      setCoupons(data);
    } catch (err) {
      const fetchError = err as Error;
      setError(fetchError.message);
      console.error("Error fetching coupons:", fetchError);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setNewCoupon(prev => ({ ...prev, [name]: checked }));
    } else {
        setNewCoupon(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: CouponApiPayload = {
        code: newCoupon.code.trim().toUpperCase(),
        discountPercentage: parseFloat(newCoupon.discountPercentage),
        isActive: newCoupon.isActive,
    };
    if (newCoupon.validFrom) payload.validFrom = newCoupon.validFrom;
    if (newCoupon.validUntil) payload.validUntil = newCoupon.validUntil;
    if (newCoupon.maxUses && newCoupon.maxUses.trim() !== '') payload.maxUses = parseInt(newCoupon.maxUses, 10);
    if (newCoupon.minPurchaseAmount && newCoupon.minPurchaseAmount.trim() !== '') payload.minPurchaseAmount = parseFloat(newCoupon.minPurchaseAmount);

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json()  as { error?: string };
        throw new Error(errorData.error || 'Failed to create coupon');
      }
      alert('Coupon created successfully!');
      fetchCoupons(); 
      setNewCoupon({ code: '', discountPercentage: '', isActive: true, validFrom: '', validUntil: '', maxUses: '', minPurchaseAmount: '' });
    } catch (err) {
      const createError = err as Error;
      setError(createError.message);
      console.error("Error creating coupon:", createError);
    }
    setIsSubmitting(false);
  };

  // TODO: Implement function to toggle coupon active status
  // const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => { ... }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin - Coupon Management</h1>

      {/* Create Coupon Form */}
      <div className="mb-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Create New Coupon</h2>
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Coupon Code <span className="text-red-500">*</span></label>
              <input type="text" name="code" id="code" value={newCoupon.code} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-1">Discount (%) <span className="text-red-500">*</span></label>
              <input type="number" name="discountPercentage" id="discountPercentage" value={newCoupon.discountPercentage} onChange={handleInputChange} required min="1" max="100" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-1">Valid From (Optional)</label>
                <input type="datetime-local" name="validFrom" id="validFrom" value={newCoupon.validFrom} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">Valid Until (Optional)</label>
                <input type="datetime-local" name="validUntil" id="validUntil" value={newCoupon.validUntil} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">Max Uses (Optional, 0 for unlimited in API)</label>
                <input type="number" name="maxUses" id="maxUses" value={newCoupon.maxUses} onChange={handleInputChange} min="0" step="1" placeholder="Leave blank for unlimited" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700 mb-1">Min Purchase Amount (Optional)</label>
                <input type="number" name="minPurchaseAmount" id="minPurchaseAmount" value={newCoupon.minPurchaseAmount} onChange={handleInputChange} min="0" step="0.01" placeholder="Leave blank if no minimum" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>

          <div className="flex items-center">
            <input type="checkbox" name="isActive" id="isActive" checked={newCoupon.isActive} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
          </div>

          {error && <p className="text-sm text-red-600">Error: {error}</p>}

          <div>
            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {isSubmitting ? 'Creating Coupon...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>

      {/* Coupon List */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-4 p-6 text-gray-700 border-b">Existing Coupons</h2>
        {isLoading && <p className="p-6 text-center text-gray-500">Loading coupons...</p>}
        {!isLoading && !error && coupons.length === 0 && <p className="p-6 text-center text-gray-500">No coupons found. Create one above!</p>}
        {!isLoading && error && !coupons.length && <p className="p-6 text-center text-red-500">Error loading coupons: {error}</p>}
        
        {!isLoading && coupons.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.discountPercentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.uses}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.validFrom ? new Date(coupon.validFrom).toLocaleString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.validUntil ? new Date(coupon.validUntil).toLocaleString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className={`text-indigo-600 hover:text-indigo-900 disabled:opacity-50 line-through`} title="Implement toggle status">Toggle Active</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 