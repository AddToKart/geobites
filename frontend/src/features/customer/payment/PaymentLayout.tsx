import type { ReactNode } from "react";
import { Landmark, ShieldCheck } from "lucide-react";

export interface BrandConfig {
  name: string;
  logo: ReactNode;
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  accent: string;
}

export const GCASH_BRAND: BrandConfig = {
  name: "GCash",
  logo: <Landmark className="h-6 w-6" strokeWidth={2.5} />,
  bg: "bg-[#005CEE] text-white",
  text: "text-[#005CEE]",
  border: "border-[#005CEE]",
  hoverBg: "hover:bg-[#004bbd]",
  accent: "#005CEE",
};

export const MAYA_BRAND: BrandConfig = {
  name: "Maya",
  logo: <Landmark className="h-6 w-6" strokeWidth={2.5} />,
  bg: "bg-[#00D15A] text-white",
  text: "text-[#00D15A]",
  border: "border-[#00D15A]",
  hoverBg: "hover:bg-[#00a849]",
  accent: "#00D15A",
};

export const QRPH_BRAND: BrandConfig = {
  name: "QR PH",
  logo: <Landmark className="h-6 w-6" strokeWidth={2.5} />,
  bg: "bg-foreground text-background",
  text: "text-foreground",
  border: "border-foreground",
  hoverBg: "hover:bg-foreground/90",
  accent: "#09090b",
};

export const GEOPAY_BRAND: BrandConfig = {
  name: "GeoPay",
  logo: <Landmark className="h-6 w-6" strokeWidth={2.5} />,
  bg: "bg-primary text-primary-foreground",
  text: "text-primary",
  border: "border-primary",
  hoverBg: "hover:bg-primary/90",
  accent: "#ff5a00",
};

interface PaymentLayoutProps {
  brand: BrandConfig;
  merchantName: string;
  amount: number;
  isCashIn?: boolean;
  children: ReactNode;
}

export function PaymentLayout({ brand, merchantName, amount, isCashIn = false, children }: PaymentLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col md:flex-row">
      <div className={`md:w-5/12 lg:w-1/2 p-8 md:p-12 lg:p-24 flex flex-col justify-between ${brand.bg} relative`}>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight flex items-center gap-2">
            {brand.logo}
            {brand.name}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1 border border-current">
            <ShieldCheck className="h-4 w-4" />
            Secure Sandbox
          </span>
        </div>

        <div className="mt-16 md:mt-0">
          <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-4">
            {isCashIn ? "Service" : "Merchant"}
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tighter mb-12 leading-none">
            {isCashIn ? "GeoPay Wallet" : merchantName}
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">
            {isCashIn ? "Amount to Cash In" : "Total Amount"}
          </p>
          <div className="text-7xl md:text-[8rem] font-medium tracking-tighter leading-[0.9]">
            ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="md:w-7/12 lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background border-l border-border relative">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
