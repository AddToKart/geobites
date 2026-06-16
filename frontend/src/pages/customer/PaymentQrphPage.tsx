import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PaymentLayout, QRPH_BRAND } from "@/features/customer/payment/PaymentLayout";
import { PaymentSuccess } from "@/features/customer/payment/PaymentSuccess";
import api from "@/services/api";
import { toast } from "sonner";

export function PaymentQrphPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId") || "";
  const amount = Number(searchParams.get("amount") || "0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"scan" | "success">("scan");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const qrRef = useRef(false);

  useEffect(() => {
    if (qrRef.current) return;
    qrRef.current = true;
    import("qrcode").then((QRCode) => {
      const ref = orderId || "geobites-payment";
      QRCode.toString(ref, {
        type: "svg",
        margin: 2,
        width: 400,
        color: { dark: "#09090b", light: "#ffffff" },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    });
  }, [orderId]);

  const handleSimulateScan = async () => {
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
    <PaymentLayout brand={QRPH_BRAND} merchantName="Geobites" amount={amount}>
      {step === "scan" ? (
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
            onClick={handleSimulateScan}
            disabled={isSubmitting}
            className="w-full h-16 bg-foreground text-background font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Simulate Scan Success"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <PaymentSuccess brandBg="bg-foreground text-background" />
      )}
    </PaymentLayout>
  );
}
