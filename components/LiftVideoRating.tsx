'use client';

import { useState, useEffect } from 'react';
import { Star, Video, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { addFormRating, getUserRating, getFormRatings } from '@/lib/firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { FormRating } from '@/types/workout';
import { cn } from '@/lib/utils';

interface LiftVideoRatingProps {
  liftOwnerId: string;
  liftId: string;
  videoUrl: string;
  averageRating?: number;
  ratingCount?: number;
  ownerName?: string;
  exerciseName: string;
  weight: number;
  reps: number;
}

export function LiftVideoRating({
  liftOwnerId,
  liftId,
  videoUrl,
  averageRating,
  ratingCount,
  ownerName,
  exerciseName,
  weight,
  reps,
}: LiftVideoRatingProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allRatings, setAllRatings] = useState<FormRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  const isOwner = user?.uid === liftOwnerId;

  useEffect(() => {
    if (open && user) {
      loadUserRating();
      loadAllRatings();
    }
  }, [open, user]);

  const loadUserRating = async () => {
    if (!user || isOwner) return;
    const existing = await getUserRating(liftOwnerId, liftId, user.uid);
    if (existing) {
      setUserRating(existing.rating);
      setComment(existing.comment || '');
    }
  };

  const loadAllRatings = async () => {
    setLoadingRatings(true);
    try {
      const ratings = await getFormRatings(liftOwnerId, liftId);
      setAllRatings(ratings);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!user || !userRating || isOwner) return;

    setSubmitting(true);
    try {
      await addFormRating(
        liftOwnerId,
        liftId,
        user.uid,
        userRating as 1 | 2 | 3 | 4 | 5,
        comment || undefined
      );
      await loadAllRatings();
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating ?? userRating;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Video className="h-3.5 w-3.5" />
        <span>Vidéo</span>
        {averageRating !== undefined && averageRating !== null && (
          <span className="flex items-center gap-0.5 text-yellow-500">
            <Star className="h-3 w-3 fill-current" />
            {averageRating.toFixed(1)}
            {ratingCount !== undefined && <span className="text-muted-foreground">({ratingCount})</span>}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {ownerName && <span>{ownerName} -</span>}
              <span className="capitalize">{exerciseName}</span>
              <span className="text-primary">{weight}kg × {reps}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                playsInline
              />
            </div>

            {averageRating !== undefined && averageRating !== null && (
              <div className="flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Note moyenne:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-5 w-5',
                        star <= Math.round(averageRating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({ratingCount} avis)</span>
              </div>
            )}

            {!isOwner && user && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">Évalue cette forme:</p>

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setUserRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          displayRating && star <= displayRating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300 hover:text-yellow-300'
                        )}
                      />
                    </button>
                  ))}
                </div>

                <Textarea
                  placeholder="Ajoute un commentaire (optionnel)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                />

                <Button
                  onClick={handleSubmitRating}
                  disabled={!userRating || submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {userRating ? 'Envoyer ma note' : 'Sélectionne une note'}
                </Button>
              </div>
            )}

            {isOwner && (
              <p className="text-sm text-center text-muted-foreground">
                Tu ne peux pas noter ta propre vidéo
              </p>
            )}

            {allRatings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Avis ({allRatings.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allRatings.map((rating) => (
                    <div
                      key={rating.id}
                      className="flex items-start gap-2 p-2 bg-muted/20 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-3.5 w-3.5',
                              star <= rating.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      {rating.comment && (
                        <p className="text-muted-foreground flex-1">{rating.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
