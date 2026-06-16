import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Landmark, Smartphone, KeyRound, Receipt } from "lucide-react";
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
  const token = searchParams.get("token") || "";
 
  const [step, setStep] = useState<"phone" | "otp" | "confirm" | "success">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const qrRef = useRef(false);
 
  const isGcash = method === "GCASH";
  const isMaya = method === "MAYA";
  const isQr = method === "QRPH";
 
  const brandBg = isGcash 
    ? "bg-[#005CEE] text-white" 
    : isMaya 
      ? "bg-[#00D15A] text-white"
      : "bg-foreground text-background";
      
  const brandText = isGcash 
    ? "text-[#005CEE]" 
    : isMaya 
      ? "text-[#00D15A]"
      : "text-foreground";
      
  const brandBorder = isGcash 
    ? "border-[#005CEE]" 
    : isMaya 
      ? "border-[#00D15A]"
      : "border-foreground";

  const brandHoverBg = isGcash
    ? "hover:bg-[#004bbd]"
    : isMaya
      ? "hover:bg-[#00a849]"
      : "hover:bg-foreground/90";

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
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      if (cashInId) {
        await api.post(`/wallet/cash-in/${cashInId}/simulate-success`, {}, { headers });
        setStep("success");
        toast.success("Wallet cash-in authorized successfully");
        setTimeout(() => {
          navigate(`/wallet`);
        }, 2000);
      } else {
        await api.post(`/payments/${orderId}/simulate-success`, {}, { headers });
        setStep("success");
        toast.success("Payment authorized successfully");
        setTimeout(() => {
          navigate(`/receipt/${orderId}`);
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
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col md:flex-row">
        {/* Brand/Info Left Side */}
        <div className={`md:w-1/2 p-8 md:p-12 lg:p-24 flex flex-col justify-between ${brandBg} relative`}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Landmark className="h-6 w-6" strokeWidth={2.5} />
              QR PH
            </span>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 border border-current">
              Sandbox
            </span>
          </div>

          <div className="mt-16 md:mt-0">
            <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-4">
              {cashInId ? "Service" : "Merchant"}
            </p>
            <h1 className="text-5xl md:text-6xl font-medium tracking-tighter mb-12">
              {cashInId ? "GeoPay Wallet" : "Geobites"}
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">Total Amount</p>
            <div className="text-7xl md:text-[8rem] font-medium tracking-tighter leading-[0.9]">
              {formatCurrency(amount)}
            </div>
          </div>
        </div>

        {/* Action Right Side */}
        <div className="md:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background border-l border-border relative">
          <div className="w-full max-w-md mx-auto">
            {step !== "success" ? (
              <div className="space-y-12">
                <div>
                  <h2 className="text-4xl font-medium tracking-tighter mb-4">Scan to Pay</h2>
                  <p className="text-muted-foreground text-lg">
                    Scan this code with your mobile banking app or e-wallet to complete the transaction.
                  </p>
                </div>

                <div className="p-8 border-4 border-foreground/10 flex justify-center items-center bg-secondary/10 relative" style={{ minHeight: 320 }}>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-foreground"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-foreground"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-foreground"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-foreground"></div>

                  <div className="w-64 h-64 border border-border bg-background p-4 relative flex items-center justify-center">
                    {qrDataUrl ? (
                      <div dangerouslySetInnerHTML={{ __html: qrDataUrl }} className="w-full h-full" />
                    ) : (
                      <div className="grid grid-cols-5 gap-2 w-full h-full">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`${(i * 7 + 13) % 3 === 0 ? "bg-foreground" : "bg-transparent"}`} />
                        ))}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-background border-4 border-foreground px-3 py-1.5 text-foreground font-bold tracking-tighter text-base">
                        QR PH
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className={`w-full h-16 bg-foreground text-background font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50`}
                >
                  {isSubmitting ? "Verifying..." : "Simulate Scan Success"}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 py-12">
                <div className="flex justify-center mb-8">
                  <div className="h-24 w-24 bg-foreground text-background rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                </div>
                <h2 className="text-4xl font-medium tracking-tighter text-foreground">Transaction complete.</h2>
                <p className="text-xl text-muted-foreground">Redirecting to Geobites...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GCASH or MAYA layout
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background flex flex-col md:flex-row">
      {/* Brand/Info Left Side */}
      <div className={`md:w-5/12 lg:w-1/2 p-8 md:p-12 lg:p-24 flex flex-col justify-between ${brandBg} relative`}>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {isGcash ? "GCash" : "Maya"}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1 border border-current">
            <ShieldCheck className="h-4 w-4" />
            Secure Sandbox
          </span>
        </div>

        <div className="mt-16 md:mt-0">
          <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-4">
            {cashInId ? "Service" : "Merchant"}
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tighter mb-12 leading-none">
            {cashInId ? "GeoPay Wallet" : "Geobites"}
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">Total Amount</p>
          <div className="text-7xl md:text-[8rem] font-medium tracking-tighter leading-[0.9]">
            {formatCurrency(amount)}
          </div>
        </div>
      </div>

      {/* Action Right Side */}
      <div className="md:w-7/12 lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background border-l border-border relative">
        <div className="w-full max-w-md mx-auto">
          {step === "phone" && (
            <div className="space-y-12">
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-secondary/20 text-muted-foreground border border-border">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h2 className="text-4xl font-medium tracking-tighter mb-4">Log in to {isGcash ? "GCash" : "Maya"}</h2>
                <p className="text-muted-foreground text-lg">Enter your mobile number to authenticate this transaction.</p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-medium text-foreground">
                      +63
                    </span>
                    <Input
                      type="tel"
                      placeholder="917 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      className={`pl-16 h-20 rounded-none text-3xl font-medium border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:${brandBorder} transition-colors`}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full h-16 ${brandBg} ${brandHoverBg} font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-colors`}
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
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block">
                    6-Digit OTP
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className={`h-20 rounded-none text-4xl font-medium text-center tracking-[0.2em] border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:${brandBorder} transition-colors`}
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full h-16 ${brandBg} ${brandHoverBg} font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-colors`}
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
                    <span className={`block text-xl font-medium tracking-tighter ${brandText}`}>
                      {isGcash ? "GCash Wallet" : "Maya Wallet"}
                    </span>
                    <span className="text-sm text-muted-foreground">***{phoneNumber.slice(-4)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-6">
                  <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Amount</span>
                  <span className="text-2xl font-medium tracking-tighter text-foreground">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Fee</span>
                  <span className="text-lg font-medium tracking-tighter text-green-500">Free</span>
                </div>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className={`w-full h-16 ${brandBg} ${brandHoverBg} font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-50`}
              >
                {isSubmitting ? "Authorizing..." : `Pay ${formatCurrency(amount)}`}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 py-12">
              <div className="flex justify-center mb-8">
                <div className={`h-24 w-24 ${brandBg} rounded-full flex items-center justify-center`}>
                  <CheckCircle2 className="h-12 w-12" />
                </div>
              </div>
              <h2 className="text-4xl font-medium tracking-tighter text-foreground">Transaction complete.</h2>
              <p className="text-xl text-muted-foreground">Redirecting to Geobites...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
