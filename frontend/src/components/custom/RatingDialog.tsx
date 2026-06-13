import { useState } from 'react';
import { Star, MessageSquare, Send, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitRating } from '@/services/ratingService';
import { toast } from 'sonner';

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-1 transition-all ${
            star <= value
              ? 'text-yellow-400 scale-110'
              : 'text-muted-foreground/30 hover:text-yellow-400/60'
          }`}
        >
          <Star className="h-8 w-8" fill={star <= value ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

export function RatingDialog({
  orderId,
  vendorName,
  onClose,
  onComplete,
}: {
  orderId: string;
  vendorName?: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) return;
    setSubmitting(true);
    try {
      await submitRating({ orderId, score, feedback: feedback.trim() || undefined });
      setDone(true);
      toast.success('Rating submitted!');
      setTimeout(onComplete, 1500);
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border p-8 max-w-sm w-full text-center space-y-4">
          <ThumbsUp className="h-10 w-10 text-primary mx-auto" />
          <p className="text-lg font-bold tracking-tight">Thank you!</p>
          <p className="text-sm text-muted-foreground">Your feedback helps {vendorName || 'the shop'} improve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border p-8 max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rate your experience</p>
          <p className="text-lg font-bold tracking-tight">{vendorName || 'How was your order?'}</p>
        </div>

        <StarInput value={score} onChange={setScore} />

        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <textarea
            placeholder="Share your thoughts (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full min-h-[80px] border border-border bg-transparent pl-10 pr-4 py-3 text-sm outline-none focus:border-foreground resize-none"
            maxLength={500}
          />
          <span className="absolute right-2 bottom-2 text-[9px] text-muted-foreground">{feedback.length}/500</span>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={score === 0 || submitting}
            className="flex-1 h-12 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs rounded-none"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit rating'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 px-6 rounded-none border border-border font-bold uppercase tracking-widest text-xs"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
