import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Smartphone, KeyRound, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaymentLayout, GCASH_BRAND } from "@/features/customer/payment/PaymentLayout";
import { PaymentSuccess } from "@/features/customer/payment/PaymentSuccess";
import api from "@/services/api";
import { toast } from "sonner";

export function PaymentGcashPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId") || "";
  const amount = Number(searchParams.get("amount") || "0");
  const [step, setStep] = useState<"phone" | "otp" | "confirm" | "success">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }
    setStep("confirm");
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/payments/${orderId}/simulate-success`);
      setStep("success");
      toast.success("Payment authorized successfully");
      setTimeout(() => navigate(`/receipt/${orderId}`), 2000);
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : "Failed to authorize payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PaymentLayout brand={GCASH_BRAND} merchantName="Geobites" amount={amount}>
      {step === "phone" && (
        <div className="space-y-12">
          <div>
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-secondary/20 text-muted-foreground border border-border">
              <Smartphone className="h-6 w-6" />
            </div>
            <h2 className="text-4xl font-medium tracking-tighter mb-4">Log in to GCash</h2>
            <p className="text-muted-foreground text-lg">Enter your mobile number to authenticate this transaction.</p>
          </div>
          <form onSubmit={handlePhoneSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-medium text-foreground">+63</span>
                <Input
                  type="tel"
                  placeholder="917 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="pl-16 h-20 rounded-none text-3xl font-medium border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-[#005CEE] transition-colors"
                  maxLength={10}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-16 bg-[#005CEE] text-white hover:bg-[#004bbd] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-colors"
            >
              Next
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-300">
          <div>
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-secondary/20 text-muted-foreground border border-border">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-4xl font-medium tracking-tighter mb-4">Verification</h2>
            <p className="text-muted-foreground text-lg">Enter the 6-digit code sent to +63 {phoneNumber}.</p>
          </div>
          <form onSubmit={handleOtpSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block">6-Digit OTP</label>
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="h-20 rounded-none text-4xl font-medium text-center tracking-[0.2em] border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-[#005CEE] transition-colors"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full h-16 bg-[#005CEE] text-white hover:bg-[#004bbd] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-colors"
            >
              Verify
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-300">
          <div>
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-secondary/20 text-muted-foreground border border-border">
              <Receipt className="h-6 w-6" />
            </div>
            <h2 className="text-4xl font-medium tracking-tighter mb-4">Confirm Payment</h2>
            <p className="text-muted-foreground text-lg">Review details before authorizing.</p>
          </div>
          <div className="border border-border bg-secondary/5 p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-6">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Source</span>
              <div className="text-right">
                <span className="block text-xl font-medium tracking-tighter text-[#005CEE]">GCash Wallet</span>
                <span className="text-sm text-muted-foreground">***{phoneNumber.slice(-4)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-6">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Amount</span>
              <span className="text-2xl font-medium tracking-tighter text-foreground">₱{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Fee</span>
              <span className="text-lg font-medium tracking-tighter text-green-500">Free</span>
            </div>
          </div>
          <button
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
            className="w-full h-16 bg-[#005CEE] text-white hover:bg-[#004bbd] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Authorizing..." : `Pay ₱${amount.toFixed(2)}`}
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </button>
        </div>
      )}

      {step === "success" && <PaymentSuccess brandBg="bg-[#005CEE]" />}
    </PaymentLayout>
  );
}
