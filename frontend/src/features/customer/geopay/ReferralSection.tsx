import { useState } from "react";
import { Users, Copy, Check, Share2, History, Gift } from "lucide-react";
import { useReferralCode, useReferralHistory, useRegisterReferral } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { toast } from "sonner";

export function ReferralSection() {
  const { user } = useAuth();
  const { data: referral, isLoading: codeLoading } = useReferralCode();
  const { data: history = [], isLoading: historyLoading } = useReferralHistory();
  const registerMutation = useRegisterReferral();
  const [copied, setCopied] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const isLoading = codeLoading || historyLoading;

  const referralLink = referral?.referralCode
    ? `${window.location.origin}/referral/${referral.referralCode}`
    : "";

  const copyToClipboard = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleRegister = () => {
    if (!referralCodeInput.trim()) return;
    registerMutation.mutate(
      { code: referralCodeInput.trim(), email: user?.email },
      {
        onSuccess: () => {
          setReferralCodeInput("");
          setShowRegister(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="border border-border bg-background p-8 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-border rounded" />
          <div className="h-12 bg-border rounded" />
          <div className="h-12 bg-border rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-background">
      <div className="p-8 md:p-12 border-b border-border">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h3 className="text-3xl font-medium tracking-tighter">Refer a Friend</h3>
          </div>
          <Share2 className="h-5 w-5 text-muted-foreground" />
        </div>

        <p className="text-lg text-muted-foreground mb-8">
          Share your code and earn <Gift className="inline h-5 w-5 text-primary" />{" "}
          <span className="text-primary font-bold">500 reward points</span> for every friend who signs up and completes their first order (worth ₱50 in discounts).
        </p>

        {referral?.referralCode && (
          <div className="border border-border p-6 mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
              Your Referral Code
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-secondary/10 px-6 py-4 border border-border">
                <span className="text-3xl font-mono font-bold tracking-wider text-primary">
                  {referral.referralCode}
                </span>
              </div>
              <button
                onClick={copyToClipboard}
                className="h-16 w-16 border border-border flex items-center justify-center hover:bg-secondary/10 transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-border p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Referred</p>
            <p className="text-2xl font-medium">{referral?.totalReferrals ?? 0}</p>
          </div>
          <div className="border border-border p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-medium">{referral?.pendingReferrals ?? 0}</p>
          </div>
        </div>

        {!showRegister ? (
          <button
            onClick={() => setShowRegister(true)}
            className="w-full h-14 border border-dashed border-border text-muted-foreground font-bold uppercase tracking-widest text-sm hover:border-foreground hover:text-foreground transition-colors"
          >
            + Have a referral code?
          </button>
        ) : (
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter referral code"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
              className="flex-1 h-14 border border-border bg-transparent px-4 text-lg font-medium focus:outline-none focus:border-foreground uppercase"
            />
            <button
              onClick={handleRegister}
              disabled={!referralCodeInput.trim() || registerMutation.isPending}
              className="h-14 px-6 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {registerMutation.isPending ? "..." : "Apply"}
            </button>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Referral History</p>
          </div>
          <Stagger className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((entry) => (
              <StaggerItem key={entry.id}>
                <div className="flex items-center justify-between p-4 border border-border">
                  <div>
                    <p className="text-sm font-medium">{entry.referredEmail || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{entry.status}</p>
                  </div>
                  <div className="text-right">
                    {entry.status === "rewarded" && (
                      <span className="text-lg font-medium text-green-500">+500 pts</span>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}
