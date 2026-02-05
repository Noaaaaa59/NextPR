'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signOut } from '@/lib/firebase/auth';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Save, Scale, Dumbbell, Calendar } from 'lucide-react';
import { Gender, getWeightCategory, WEIGHT_CATEGORIES_MALE, WEIGHT_CATEGORIES_FEMALE, PriorityLift, ProgramType } from '@/types/user';
import { getAllStandards } from '@/lib/calculations/standards';

type Experience = 'beginner' | 'intermediate' | 'advanced';
type WeightUnit = 'kg' | 'lbs';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [bodyweight, setBodyweight] = useState(userData?.bodyweight?.toString() || '');
  const [gender, setGender] = useState<Gender>(userData?.gender || 'male');
  const [experience, setExperience] = useState<Experience>(userData?.experience as Experience || 'beginner');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(userData?.preferences?.weightUnit as WeightUnit || 'kg');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(userData?.programSettings?.daysPerWeek || 3);
  const [durationWeeks, setDurationWeeks] = useState<4 | 6>(userData?.programSettings?.durationWeeks || 4);
  const [priorityLift, setPriorityLift] = useState<PriorityLift>(userData?.programSettings?.priorityLift || 'squat');
  const [programType, setProgramType] = useState<ProgramType>(userData?.programSettings?.programType || 'auto');

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName || userData?.displayName,
        bodyweight: parseFloat(bodyweight) || 0,
        gender: gender,
        experience: experience,
        preferences: {
          weightUnit: weightUnit,
          theme: userData?.preferences?.theme || 'light',
        },
        programSettings: {
          daysPerWeek,
          durationWeeks,
          priorityLift,
          programType,
        },
      });
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(userData?.displayName || '');
    setBodyweight(userData?.bodyweight?.toString() || '');
    setGender(userData?.gender || 'male');
    setExperience(userData?.experience as Experience || 'beginner');
    setWeightUnit(userData?.preferences?.weightUnit as WeightUnit || 'kg');
    setDaysPerWeek(userData?.programSettings?.daysPerWeek || 3);
    setDurationWeeks(userData?.programSettings?.durationWeeks || 4);
    setPriorityLift(userData?.programSettings?.priorityLift || 'squat');
    setProgramType(userData?.programSettings?.programType || 'auto');
    setIsEditing(false);
  };

  const experienceOptions: { value: Experience; label: string }[] = [
    { value: 'beginner', label: 'Débutant (< 1 an)' },
    { value: 'intermediate', label: 'Intermédiaire (1-3 ans)' },
    { value: 'advanced', label: 'Avancé (3+ ans)' },
  ];

  const currentCategory = bodyweight ? getWeightCategory(parseFloat(bodyweight), gender) : null;
  const categories = gender === 'male' ? WEIGHT_CATEGORIES_MALE : WEIGHT_CATEGORIES_FEMALE;

  const eliteStandards = bodyweight && currentCategory ? {
    squat: getAllStandards('squat', parseFloat(bodyweight), gender).elite,
    bench: getAllStandards('bench', parseFloat(bodyweight), gender).elite,
    deadlift: getAllStandards('deadlift', parseFloat(bodyweight), gender).elite,
  } : null;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Profil</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations et préférences
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" size="sm">
              Annuler
            </Button>
            <Button onClick={handleSave} size="sm" disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Informations personnelles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-destructive font-medium">Nom</Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ton nom"
                  />
                ) : (
                  <p className="text-sm font-medium py-2">{userData?.displayName || '—'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-destructive font-medium">Email</Label>
                <p className="text-sm font-medium py-2">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-destructive font-medium">Genre</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                        gender === 'male'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      Homme
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                        gender === 'female'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      Femme
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium py-2">
                    {userData?.gender === 'female' ? 'Femme' : 'Homme'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyweight" className="flex items-center gap-1 text-destructive font-medium">
                  <Scale className="h-3 w-3" />
                  Poids de corps ({weightUnit})
                </Label>
                {isEditing ? (
                  <Input
                    id="bodyweight"
                    type="number"
                    value={bodyweight}
                    onChange={(e) => setBodyweight(e.target.value)}
                    placeholder="Ex: 80"
                    min="30"
                    max="200"
                    step="0.1"
                  />
                ) : (
                  <p className="text-sm font-medium py-2">
                    {userData?.bodyweight ? `${userData.bodyweight} ${weightUnit}` : '—'}
                  </p>
                )}
              </div>
            </div>

            {currentCategory && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Catégorie IPF : </span>
                  <span className="font-bold text-primary">{currentCategory}{currentCategory.includes('+') ? '' : ' kg'}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="experience" className="flex items-center gap-1 text-destructive font-medium">
                <Dumbbell className="h-3 w-3" />
                Expérience
              </Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {experienceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExperience(opt.value)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        experience === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium py-2 capitalize">
                  {experienceOptions.find((o) => o.value === userData?.experience)?.label || '—'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Préférences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-destructive font-medium">Unité de poids</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                        weightUnit === 'kg'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      Kilogrammes (kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                        weightUnit === 'lbs'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      Livres (lbs)
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium py-2">
                    {weightUnit === 'kg' ? 'Kilogrammes (kg)' : 'Livres (lbs)'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Programme</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-destructive font-medium">Type de programme</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {([
                    { value: 'auto' as const, label: 'Auto', desc: 'Sélection automatique selon ton niveau' },
                    { value: 'linear' as const, label: 'Linéaire', desc: 'Simple et efficace. Volume → Intensité → Test PR' },
                    { value: '531' as const, label: '5/3/1', desc: 'Wendler. Training Max (90%) + BBB. Progression lente mais sûre' },
                    { value: 'hypertrophy' as const, label: 'Hypertrophie', desc: 'Volume élevé (4x10). Focus sur la masse musculaire' },
                    { value: 'block' as const, label: 'Blocs', desc: 'Avancé. Accumulation → Intensification → Peak (8 sem)' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProgramType(opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        programType === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className={`text-xs ${programType === opt.value ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium py-2">
                  {userData?.programSettings?.programType === '531' ? '5/3/1 (Wendler)' :
                   userData?.programSettings?.programType === 'linear' ? 'Linéaire' :
                   userData?.programSettings?.programType === 'hypertrophy' ? 'Hypertrophie' :
                   userData?.programSettings?.programType === 'block' ? 'Blocs' :
                   'Automatique'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-destructive font-medium">Durée du cycle</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  {([4, 6] as const).map((weeks) => (
                    <button
                      key={weeks}
                      type="button"
                      onClick={() => setDurationWeeks(weeks)}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                        durationWeeks === weeks
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {weeks} semaines
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium py-2">{userData?.programSettings?.durationWeeks || 4} semaines</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-destructive font-medium">Jours par semaine</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  {([3, 4, 5] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDaysPerWeek(days)}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                        daysPerWeek === days
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {days} jours
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium py-2">{userData?.programSettings?.daysPerWeek || 3} jours/semaine</p>
              )}
            </div>

            {(isEditing ? daysPerWeek > 3 : (userData?.programSettings?.daysPerWeek || 3) > 3) && (
              <div className="space-y-2">
                <Label className="text-destructive font-medium">Lift prioritaire</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    {([
                      { value: 'squat' as const, label: 'Squat' },
                      { value: 'bench' as const, label: 'Bench' },
                      { value: 'deadlift' as const, label: 'Deadlift' },
                    ]).map((lift) => (
                      <button
                        key={lift.value}
                        type="button"
                        onClick={() => setPriorityLift(lift.value)}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                          priorityLift === lift.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        {lift.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium py-2 capitalize">{userData?.programSettings?.priorityLift || 'squat'}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ce lift sera travaillé {daysPerWeek === 4 ? '3' : '4'}x/semaine
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing && eliteStandards && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm">
                Standards Elite pour la catégorie <strong>{currentCategory}{currentCategory?.includes('+') ? '' : ' kg'}</strong> ({gender === 'male' ? 'Homme' : 'Femme'}) :
              </p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-background rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Squat Elite</p>
                  <p className="font-bold text-primary">{eliteStandards.squat} {weightUnit}</p>
                </div>
                <div className="bg-background rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Bench Elite</p>
                  <p className="font-bold text-primary">{eliteStandards.bench} {weightUnit}</p>
                </div>
                <div className="bg-background rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Deadlift Elite</p>
                  <p className="font-bold text-primary">{eliteStandards.deadlift} {weightUnit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              <CardTitle className="text-base">Déconnexion</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Tu seras redirigé vers la page de connexion.
            </p>
            <Button variant="destructive" size="sm" onClick={handleSignOut}>
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
