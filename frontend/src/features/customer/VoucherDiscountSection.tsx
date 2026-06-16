import { useEffect, useState } from "react";
import { Tag, Gift, TicketCheck, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getActiveVouchers, validateVoucherCode } from "@/services/voucherService";
import { useRewardsBalance } from "@/hooks/queries";
import { formatCurrency } from "@/utils/helpers";
import { toast } from "sonner";

interface Props {
  vendorId: string;
  orderAmount: number;
  onDiscountChange: (details: { voucherDiscount: number; pointsDiscount: number; voucherCode?: string }) => void;
}

export function VoucherDiscountSection({ vendorId, orderAmount, onDiscountChange }: Props) {
  const { data: rewards } = useRewardsBalance();
  const { data: vouchers = [] } = useQuery({
    queryKey: ["vouchers", "active", vendorId],
    queryFn: () => getActiveVouchers(vendorId),
    enabled: !!vendorId,
  });

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [validating, setValidating] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  const canUsePoints = (rewards?.discountBalance ?? 0) > 0;
  const pointsDiscount = usePoints ? Math.min(rewards?.discountBalance ?? 0, orderAmount) : 0;
  const voucherDiscount = appliedVoucher?.discount ?? 0;
  const totalDiscount = voucherDiscount + pointsDiscount;
  const finalTotal = Math.max(0, orderAmount - totalDiscount);

  const applyVoucherCode = async (code: string) => {
    if (!code.trim()) return;
    setValidating(true);
    try {
      const result = await validateVoucherCode(code.trim().toUpperCase(), vendorId, orderAmount);
      setAppliedVoucher({ code: result.voucher.code, discount: result.discountAmount });
      setVoucherCode("");
      toast.success(`Voucher applied! ${result.discountAmount > 0 ? `-${formatCurrency(result.discountAmount)}` : ""}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Invalid voucher");
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
  };

  useEffect(() => {
    onDiscountChange({ voucherDiscount, pointsDiscount, voucherCode: appliedVoucher?.code });
  }, [voucherDiscount, pointsDiscount, appliedVoucher, onDiscountChange]);

  return (
    <div className="border border-border bg-background p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <TicketCheck className="h-5 w-5 text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-foreground">Discounts & Vouchers</p>
      </div>

      {!appliedVoucher ? (
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter voucher code"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            className="flex-1 h-12 border border-border bg-transparent px-4 text-sm font-medium focus:outline-none focus:border-foreground uppercase"
          />
          <button
            onClick={() => applyVoucherCode(voucherCode)}
            disabled={!voucherCode.trim() || validating}
            className="h-12 px-5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 mb-6">
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold">{appliedVoucher.code}</p>
              <p className="text-xs text-muted-foreground">-{formatCurrency(appliedVoucher.discount)}</p>
            </div>
          </div>
          <button
            onClick={handleRemoveVoucher}
            className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      )}

      {vouchers.length > 0 && !appliedVoucher && (
        <div className="mb-6 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available Vouchers</p>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {vouchers.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => applyVoucherCode(v.code)}
                className="w-full flex items-center gap-3 p-3 border border-border text-left hover:bg-secondary/5 transition-colors"
              >
                <Gift className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{v.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {v.discountType === "fixed" ? `₱${v.discountValue} off` : `${v.discountValue}% off`}
                    {v.minOrderAmount > 0 ? ` • Min: ${formatCurrency(v.minOrderAmount)}` : ""}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary shrink-0">Apply</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {canUsePoints && (
        <div className="flex items-center justify-between p-4 border border-border">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Rewards Discount</p>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(rewards?.discountBalance ?? 0)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUsePoints(!usePoints)}
            className={`h-10 px-4 text-xs font-bold uppercase tracking-widest border transition-colors ${
              usePoints
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-foreground hover:bg-secondary/10"
            }`}
          >
            {usePoints ? "Applied" : "Apply"}
          </button>
        </div>
      )}

      {totalDiscount > 0 && (
        <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium">Discount</span>
            <span className="text-green-600 font-bold">-{formatCurrency(totalDiscount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-green-500/20">
            <span className="font-medium">Final Total</span>
            <span className="font-bold">{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
