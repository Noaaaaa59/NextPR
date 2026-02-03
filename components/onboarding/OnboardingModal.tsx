'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Experience, Gender } from '@/types/user';
import { completeOnboarding } from '@/lib/firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState<Gender | null>(null);
  const [bodyweight, setBodyweight] = useState<string>('');
  const [experience, setExperience] = useState<Experience | null>(null);
  const [prs, setPRs] = useState({ squat: '', bench: '', deadlift: '' });

  const canProceedStep1 = gender !== null && parseFloat(bodyweight) > 0;
  const canProceedStep2 = experience !== null;
  const canProceedStep3 =
    parseFloat(prs.squat) > 0 &&
    parseFloat(prs.bench) > 0 &&
    parseFloat(prs.deadlift) > 0;

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleComplete = async () => {
    if (!user || !gender || !experience) return;

    setLoading(true);
    try {
      await completeOnboarding(
        user.uid,
        {
          gender,
          bodyweight: parseFloat(bodyweight),
          experience,
        },
        {
          squat: parseFloat(prs.squat) || 0,
          bench: parseFloat(prs.bench) || 0,
          deadlift: parseFloat(prs.deadlift) || 0,
        }
      );
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const experienceOptions: { value: Experience; label: string; description: string }[] = [
    { value: 'beginner', label: 'Débutant', description: 'Moins de 1 an de pratique' },
    { value: 'intermediate', label: 'Intermédiaire', description: '1-3 ans de pratique' },
    { value: 'advanced', label: 'Avancé', description: '3-5 ans de pratique' },
    { value: 'elite', label: 'Elite', description: '+5 ans, niveau compétition' },
  ];

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Bienvenue sur NextPR</DialogTitle>
          <DialogDescription>
            Configurons ton profil pour personnaliser ton expérience
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step
                  ? 'bg-primary'
                  : s < step
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Genre</Label>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    gender === 'male'
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setGender('male')}
                >
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">♂</span>
                    <p className="mt-1 font-medium">Homme</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all ${
                    gender === 'female'
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setGender('female')}
                >
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">♀</span>
                    <p className="mt-1 font-medium">Femme</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyweight">Poids corporel (kg)</Label>
              <Input
                id="bodyweight"
                type="number"
                placeholder="75"
                value={bodyweight}
                onChange={(e) => setBodyweight(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Label>Niveau d'expérience</Label>
            <div className="grid gap-2">
              {experienceOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    experience === option.value
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setExperience(option.value)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Entre tes meilleurs performances actuelles (1RM ou estimés)
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="squat">Squat (kg)</Label>
                <Input
                  id="squat"
                  type="number"
                  placeholder="100"
                  value={prs.squat}
                  onChange={(e) => setPRs({ ...prs, squat: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bench">Bench Press (kg)</Label>
                <Input
                  id="bench"
                  type="number"
                  placeholder="80"
                  value={prs.bench}
                  onChange={(e) => setPRs({ ...prs, bench: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadlift">Deadlift (kg)</Label>
                <Input
                  id="deadlift"
                  type="number"
                  placeholder="120"
                  value={prs.deadlift}
                  onChange={(e) => setPRs({ ...prs, deadlift: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Précédent
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceedStep3 || loading}
            >
              {loading ? 'Enregistrement...' : 'Terminer'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
