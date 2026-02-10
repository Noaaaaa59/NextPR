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
import { Experience, Gender, PriorityLift, ProgramType } from '@/types/user';
import { completeOnboarding } from '@/lib/firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Step = 1 | 2 | 3 | 4;

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender | null>(null);
  const [bodyweight, setBodyweight] = useState<string>('');
  const [experience, setExperience] = useState<Experience | null>(null);
  const [prs, setPRs] = useState({ squat: '', bench: '', deadlift: '' });
  const [programType, setProgramType] = useState<ProgramType>('531');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(3);
  const [durationWeeks, setDurationWeeks] = useState<4 | 6>(4);
  const [priorityLift, setPriorityLift] = useState<PriorityLift>('squat');

  const canProceedStep1 = gender !== null && parseFloat(bodyweight) > 0;
  const canProceedStep2 = experience !== null;
  const canProceedStep3 =
    parseFloat(prs.squat) > 0 &&
    parseFloat(prs.bench) > 0 &&
    parseFloat(prs.deadlift) > 0;
  const canProceedStep4 = true;

  const handleNext = () => {
    if (step < 4) {
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
          programSettings: {
            daysPerWeek: programType === 'linear' ? 3 : daysPerWeek,
            durationWeeks,
            priorityLift,
            programType,
          },
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
      setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
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
          {[1, 2, 3, 4].map((s) => (
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

        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Configure ton programme d&apos;entraînement
            </p>

            <div className="space-y-3">
              <Label>Méthode d&apos;entraînement</Label>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    programType === '531'
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setProgramType('531')}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold">5/3/1</p>
                    <p className="text-xs text-muted-foreground">Wendler - Progression ondulatoire</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all ${
                    programType === 'linear'
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setProgramType('linear')}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold">Linéaire</p>
                    <p className="text-xs text-muted-foreground">Heavy / Medium / Light</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Durée du cycle</Label>
              <div className="grid grid-cols-2 gap-3">
                {([4, 6] as const).map((weeks) => (
                  <Card
                    key={weeks}
                    className={`cursor-pointer transition-all ${
                      durationWeeks === weeks
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setDurationWeeks(weeks)}
                  >
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">{weeks}</p>
                      <p className="text-xs text-muted-foreground">semaines</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {programType === '531' && (
              <div className="space-y-3">
                <Label>Jours par semaine</Label>
                <div className="grid grid-cols-3 gap-3">
                  {([3, 4, 5] as const).map((days) => (
                    <Card
                      key={days}
                      className={`cursor-pointer transition-all ${
                        daysPerWeek === days
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setDaysPerWeek(days)}
                    >
                      <CardContent className="p-3 text-center">
                        <p className="text-lg font-bold">{days}J</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {programType === '531' && daysPerWeek > 3 && (
              <div className="space-y-3">
                <Label>Lift prioritaire (fréquence +)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'squat' as const, label: 'Squat' },
                    { value: 'bench' as const, label: 'Bench' },
                    { value: 'deadlift' as const, label: 'Deadlift' },
                  ]).map((lift) => (
                    <Card
                      key={lift.value}
                      className={`cursor-pointer transition-all ${
                        priorityLift === lift.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setPriorityLift(lift.value)}
                    >
                      <CardContent className="p-2 text-center">
                        <p className="text-sm font-medium">{lift.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce lift sera travaillé {daysPerWeek === 4 ? '3' : '4'}x/semaine au lieu de 2x
                </p>
              </div>
            )}

            {programType === 'linear' && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  3 jours/semaine fixes. Chaque lift est travaillé à 3 intensités différentes par semaine.
                </p>
              </div>
            )}
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

          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
            >
              Suivant
            </Button>
          ) : (
            <div className="space-y-2">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleComplete}
                disabled={!canProceedStep4 || loading}
                className="w-full"
              >
                {loading ? 'Enregistrement...' : 'Terminer'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
