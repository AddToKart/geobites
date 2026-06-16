import { CheckCircle2 } from "lucide-react";

interface PaymentSuccessProps {
  brandBg: string;
  message?: string;
}

export function PaymentSuccess({ brandBg, message = "Transaction complete." }: PaymentSuccessProps) {
  return (
    <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 py-12">
      <div className="flex justify-center mb-8">
        <div className={`h-24 w-24 ${brandBg} rounded-full flex items-center justify-center`}>
          <CheckCircle2 className="h-12 w-12" />
        </div>
      </div>
      <h2 className="text-4xl font-medium tracking-tighter text-foreground">{message}</h2>
      <p className="text-xl text-muted-foreground">Redirecting to Geobites...</p>
    </div>
  );
}
