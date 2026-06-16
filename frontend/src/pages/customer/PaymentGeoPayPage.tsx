import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, ShieldCheck } from "lucide-react";
import { PaymentLayout, GEOPAY_BRAND } from "@/features/customer/payment/PaymentLayout";
import { PaymentSuccess } from "@/features/customer/payment/PaymentSuccess";
import { initiatePayment } from "@/services/orderService";
import { useWallet } from "@/hooks/queries";
import { formatCurrency } from "@/utils/helpers";
import { toast } from "sonner";

export function PaymentGeoPayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId") || "";
  const amount = Number(searchParams.get("amount") || "0");
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: wallet } = useWallet();
  const balance = wallet ? Number(wallet.balance) : 0;
  const insufficientFunds = balance < amount;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await initiatePayment(orderId);
      setStep("success");
      toast.success("Paid successfully using GeoPay Wallet!");
      setTimeout(() => navigate(`/receipt/${orderId}`), 2000);
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : "GeoPay Wallet payment failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PaymentLayout brand={GEOPAY_BRAND} merchantName="Geobites" amount={amount}>
      {step === "confirm" ? (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-300">
          <div>
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-primary/10 text-primary border border-primary/20">
              <Wallet className="h-6 w-6" />
            </div>
            <h2 className="text-4xl font-medium tracking-tighter mb-4">GeoPay Wallet</h2>
            <p className="text-muted-foreground text-lg">Review and confirm your payment.</p>
          </div>

          <div className="border border-border bg-secondary/5 p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-6">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Current Balance</span>
              <span className="text-xl font-medium tracking-tighter text-foreground">{formatCurrency(balance)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-6">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Payment Amount</span>
              <span className="text-2xl font-medium tracking-tighter text-foreground">₱{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Remaining</span>
              <span className={`text-xl font-medium tracking-tighter ${insufficientFunds ? "text-red-500" : "text-green-500"}`}>
                {insufficientFunds ? "Insufficient" : formatCurrency(balance - amount)}
              </span>
            </div>
          </div>

          {insufficientFunds && (
            <div className="border-l-4 border-red-500 bg-red-500/10 p-6 flex items-start gap-4">
              <ShieldCheck className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-500">Insufficient Balance</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please top up your wallet or choose a different payment method.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={isSubmitting || insufficientFunds}
            className="w-full h-16 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting
              ? "Processing..."
              : insufficientFunds
                ? "Insufficient Balance"
                : `Pay ₱${amount.toFixed(2)}`}
            {!isSubmitting && !insufficientFunds && <ArrowRight className="h-5 w-5" />}
          </button>

          {!insufficientFunds && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Secured by GeoPay — instant wallet-to-wallet transfer</span>
            </div>
          )}
        </div>
      ) : (
        <PaymentSuccess brandBg="bg-primary text-primary-foreground" message="Payment complete." />
      )}
    </PaymentLayout>
  );
}
