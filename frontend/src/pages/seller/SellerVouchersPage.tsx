import { useState } from "react";
import { Gift, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SellerVouchersSection } from "@/features/seller/SellerVouchersSection";

export function SellerVouchersPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <button
          onClick={() => navigate('/seller')}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="border-b-2 border-foreground pb-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Marketing
          </p>
          <h1 className="text-5xl font-medium tracking-tighter">Vouchers.</h1>
          <p className="text-lg text-muted-foreground mt-2">Create and manage discount vouchers for your shop.</p>
        </div>

        <SellerVouchersSection />
      </div>
    </div>
  );
}
