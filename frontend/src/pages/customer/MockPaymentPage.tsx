import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/helpers";
import { toast } from "sonner";
import api from "@/services/api";

export function MockPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("orderId") || "";
  const cashInId = searchParams.get("cashInId") || "";
  const amount = Number(searchParams.get("amount") || "0");
  const rawMethod = searchParams.get("method") || "GCASH";
  const method = (rawMethod.toUpperCase() as "GCASH" | "MAYA" | "QRPH");
 
  const [step, setStep] = useState<"phone" | "otp" | "confirm" | "success">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  // Set colors based on method
  // GCash: #0056eb (Deep Blue)
  // Maya: #00c300 (Neon Green)
  const isGcash = method === "GCASH";
  const isMaya = method === "MAYA";
  const isQr = method === "QRPH";
 
  const primaryColorClass = isGcash 
    ? "bg-blue-600 hover:bg-blue-700" 
    : isMaya 
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-orange-500 hover:bg-orange-600";
 
  const brandBg = isGcash 
    ? "bg-[#0c4fc7]" 
    : isMaya 
      ? "bg-[#18181b]" 
      : "bg-slate-900";
 
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
      if (cashInId) {
        // Direct call to simulate success API for wallet cash-in
        await api.post(`/wallet/cash-in/${cashInId}/simulate-success`);
        setStep("success");
        toast.success("Wallet cash-in authorized successfully");
        
        // Redirect back to wallet page after a small delay
        setTimeout(() => {
          navigate(`/wallet`);
        }, 2000);
      } else {
        // Direct call to simulate success API for order payment
        await api.post(`/payments/${orderId}/simulate-success`);
        setStep("success");
        toast.success("Payment authorized successfully");
        
        // Redirect to order details page after a small delay to show checkmark
        setTimeout(() => {
          navigate(`/orders/${orderId}`);
        }, 2000);
      }
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error 
          ? caughtError.message 
          : "Failed to authorize payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isQr) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border text-card-foreground rounded-[32px] overflow-hidden shadow-[var(--shadow-panel)]">
          <div className="p-6 bg-muted border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-wider text-sm">QR PH SIMULATOR</span>
            </div>
            <span className="text-xs bg-primary-soft text-primary font-bold px-2.5 py-1 rounded-full">
              SANDBOX
            </span>
          </div>

          <CardContent className="p-8 flex flex-col items-center text-center gap-6">
            <h2 className="text-xl font-bold text-foreground">Scan to Pay</h2>
            <p className="text-sm text-text-muted">
              {cashInId ? "Service: " : "Merchant: "}
              <strong className="text-foreground">
                {cashInId ? "GeoPay Wallet Funding" : "Geobites Platform"}
              </strong>
            </p>

            {/* Generated Mock QR PH box */}
            <div className="bg-card p-5 rounded-[24px] shadow-inner relative group border-4 border-primary/20">
              <div className="h-48 w-48 bg-muted flex flex-col items-center justify-center gap-2 rounded-lg relative overflow-hidden">
                {/* Simulated QR Code visual */}
                <div className="absolute inset-0 bg-gradient-to-tr from-muted via-card to-muted flex flex-col items-center justify-center p-4">
                  <div className="grid grid-cols-5 gap-1.5 w-full aspect-square">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-sm ${(i * 7 + 13) % 3 === 0 ? "bg-foreground" : "bg-transparent"}`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground font-extrabold text-[10px] p-2 rounded-full shadow-md">
                      QR PH
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-2xl font-black tracking-tight mt-2">
              {formatCurrency(amount)}
            </div>

            <p className="text-xs text-text-muted max-w-xs leading-relaxed">
              Scan this mockup code or click below to simulate scanning with a mobile banking app.
            </p>

            <Button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className={`w-full h-13 rounded-[18px] text-base font-bold transition-all shadow-lg ${primaryColorClass}`}
            >
              {isSubmitting ? "Verifying Transaction..." : "Simulate QR Scan Success"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Brand themed sandbox wrapper */}
      <Card className="w-full max-w-md border-none overflow-hidden rounded-[32px] shadow-[0_24px_50px_rgba(0,0,0,0.12)]">
        <div className={`p-6 text-white ${brandBg} flex items-center justify-between transition-colors`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold tracking-widest text-white/60 uppercase">
              Sandbox Simulator
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              {isGcash ? "GCash" : "Maya"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4" />
            Secure
          </div>
        </div>

        <CardContent className="p-8 bg-card">
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="text-center">
                <p className="text-sm font-semibold text-text-muted">
                  {cashInId ? "Service" : "Merchant"}
                </p>
                <h3 className="text-lg font-bold text-text">
                  {cashInId ? "GeoPay Wallet Cash-In" : "Geobites Food"}
                </h3>
                <h2 className="text-3xl font-black tracking-tight text-text mt-2">
                  {formatCurrency(amount)}
                </h2>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted pl-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-text-muted">
                    +63
                  </span>
                  <Input
                    type="tel"
                    placeholder="917 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="pl-13 h-13 rounded-[16px] font-bold text-lg border-border focus:ring-2 focus:ring-primary/20"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full h-13 rounded-[18px] text-base font-bold transition-all shadow-md ${primaryColorClass}`}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold">Authentication</h2>
                <p className="text-sm text-text-muted">
                  Enter the 6-digit OTP code sent to your mobile number.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted pl-1">
                  Verification Code (OTP)
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-13 rounded-[16px] font-mono font-bold text-center tracking-[0.4em] text-2xl border-border"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className={`w-full h-13 rounded-[18px] text-base font-bold transition-all shadow-md ${primaryColorClass}`}
              >
                Verify OTP
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm font-semibold text-text-muted">
                  {cashInId ? "Funding" : "Paying"}
                </p>
                <h3 className="text-lg font-bold text-text">
                  {cashInId ? "GeoPay Wallet" : "Geobites Platform"}
                </h3>
                <h2 className="text-3xl font-black tracking-tight text-text mt-2">
                  {formatCurrency(amount)}
                </h2>
              </div>

              <div className="rounded-[20px] bg-surface-2 p-5 space-y-3 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-text-muted">Source Account</span>
                  <span className="font-bold text-text">
                    {isGcash ? "GCash Wallet" : "Maya Account"} (***{phoneNumber.slice(-4)})
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-text-muted">Amount</span>
                  <span className="font-bold text-text">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-text-muted">Transaction Fee</span>
                  <span className="font-bold text-success">₱0.00 (Free)</span>
                </div>
              </div>

              <Button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className={`w-full h-13 rounded-[18px] text-base font-bold transition-all shadow-md ${primaryColorClass}`}
              >
                {isSubmitting ? "Authorizing payment..." : `Confirm & Pay ${formatCurrency(amount)}`}
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in zoom-in-95 duration-500">
              <CheckCircle2 className="h-20 w-20 text-success animate-bounce" />
              <h2 className="text-2xl font-black tracking-tight text-text">
                {cashInId ? "Cash-In Successful" : "Payment Successful"}
              </h2>
              <p className="text-sm text-text-muted max-w-xs">
                {cashInId
                  ? `Your wallet has been successfully funded and confirmed by ${isGcash ? "GCash" : "Maya"}.`
                  : `Your payment has been successfully authorized and confirmed by ${isGcash ? "GCash" : "Maya"}.`}
              </p>
              <div className="text-xs font-semibold text-text-muted mt-2">
                Redirecting back to Geobites...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
