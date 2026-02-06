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
import { User, Settings, LogOut, Save, Scale, Dumbbell, Calendar, Trophy, Video, Star } from 'lucide-react';
import { Gender, getWeightCategory, WEIGHT_CATEGORIES_MALE, WEIGHT_CATEGORIES_FEMALE, PriorityLift, Theme, TrainingMaxPercentage } from '@/types/user';
import { Palette } from 'lucide-react';
import { getAllStandards } from '@/lib/calculations/standards';
import { useDashboardData } from '@/lib/hooks/useFirestoreData';
import { SquatIcon, BenchIcon, DeadliftIcon } from '@/components/icons/LiftIcons';
import { VideoUpload } from '@/components/VideoUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Experience = 'beginner' | 'intermediate' | 'advanced';
type WeightUnit = 'kg' | 'lbs';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { truePRs, loading: prsLoading, refreshPRs } = useDashboardData(user?.uid);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [videoUploadLift, setVideoUploadLift] = useState<'squat' | 'bench' | 'deadlift' | null>(null);

  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [bodyweight, setBodyweight] = useState(userData?.bodyweight?.toString() || '');
  const [gender, setGender] = useState<Gender>(userData?.gender || 'male');
  const [experience, setExperience] = useState<Experience>(userData?.experience as Experience || 'beginner');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(userData?.preferences?.weightUnit as WeightUnit || 'kg');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(userData?.programSettings?.daysPerWeek || 3);
  const [durationWeeks, setDurationWeeks] = useState<4 | 6>(userData?.programSettings?.durationWeeks || 4);
  const [priorityLift, setPriorityLift] = useState<PriorityLift>(userData?.programSettings?.priorityLift || 'squat');
  const [theme, setTheme] = useState<Theme>(userData?.preferences?.theme || 'dark');
  const [trainingMaxPercentage, setTrainingMaxPercentage] = useState<TrainingMaxPercentage>(userData?.programSettings?.trainingMaxPercentage || 90);

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
          theme: theme,
        },
        programSettings: {
          daysPerWeek,
          durationWeeks,
          priorityLift,
          programType: '531',
          trainingMaxPercentage,
        },
      });
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.');
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
    setTheme(userData?.preferences?.theme || 'dark');
    setTrainingMaxPercentage(userData?.programSettings?.trainingMaxPercentage || 90);
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

      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {saveError}
        </div>
      )}

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

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-destructive font-medium">
                <Palette className="h-3 w-3" />
                Thème
              </Label>
              {isEditing ? (
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'light' as const, label: 'Clair', color: 'bg-gray-100' },
                    { value: 'dark' as const, label: 'Sombre', color: 'bg-gray-800' },
                    { value: 'forest' as const, label: 'Forêt', color: 'bg-green-700' },
                    { value: 'rose' as const, label: 'Rose', color: 'bg-pink-500' },
                    { value: 'ocean' as const, label: 'Océan', color: 'bg-blue-600' },
                    { value: 'sunset' as const, label: 'Sunset', color: 'bg-orange-500' },
                  ]).map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTheme(t.value)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        theme === t.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${t.color}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium py-2">
                  {theme === 'light' ? 'Clair' :
                   theme === 'dark' ? 'Sombre' :
                   theme === 'forest' ? 'Forêt' :
                   theme === 'rose' ? 'Rose' :
                   theme === 'ocean' ? 'Océan' :
                   theme === 'sunset' ? 'Sunset' : 'Sombre'}
                </p>
              )}
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
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">Méthode : </span>
                <span className="font-bold text-primary">5/3/1 de Jim Wendler</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Training Max ({trainingMaxPercentage}% du 1RM) + BBB (Boring But Big)
              </p>
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

            <div className="space-y-2">
              <Label className="text-destructive font-medium">Training Max (%)</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  {([90, 95, 100] as const).map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTrainingMaxPercentage(pct)}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                        trainingMaxPercentage === pct
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium py-2">{userData?.programSettings?.trainingMaxPercentage || 90}%</p>
              )}
              <p className="text-xs text-muted-foreground">
                {trainingMaxPercentage === 90
                  ? 'Recommandé pour la plupart des lifters. Marge de sécurité maximale.'
                  : trainingMaxPercentage === 95
                  ? 'Pour les lifters intermédiaires/avancés. Charges plus proches du max.'
                  : 'Charges basées directement sur le 1RM. Réservé aux avancés.'}
              </p>
            </div>
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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Mes Records Personnels</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Ajoute une vidéo à tes PRs pour que la communauté puisse évaluer ta forme !
            </p>

            {prsLoading ? (
              <div className="text-center py-4 text-muted-foreground">Chargement...</div>
            ) : (
              <div className="space-y-3">
                {(['squat', 'bench', 'deadlift'] as const).map((exercise) => {
                  const pr = truePRs[exercise];
                  const Icon = exercise === 'squat' ? SquatIcon : exercise === 'bench' ? BenchIcon : DeadliftIcon;
                  const label = exercise === 'squat' ? 'Squat' : exercise === 'bench' ? 'Bench' : 'Deadlift';

                  return (
                    <div
                      key={exercise}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{label}</p>
                          {pr ? (
                            <p className="text-xs text-muted-foreground">
                              {pr.weight} kg × {pr.reps}
                              {pr.averageRating && (
                                <span className="ml-2 text-yellow-500">
                                  <Star className="h-3 w-3 inline fill-current" /> {pr.averageRating.toFixed(1)}
                                </span>
                              )}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Pas encore de PR</p>
                          )}
                        </div>
                      </div>

                      {pr && (
                        <div className="flex items-center gap-2">
                          {pr.videoUrl ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={pr.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary flex items-center gap-1 hover:underline"
                              >
                                <Video className="h-3.5 w-3.5" />
                                Voir
                              </a>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVideoUploadLift(exercise)}
                              >
                                Changer
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVideoUploadLift(exercise)}
                            >
                              <Video className="h-3.5 w-3.5 mr-1" />
                              Ajouter vidéo
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={videoUploadLift !== null} onOpenChange={(open) => !open && setVideoUploadLift(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">
                Ajouter une vidéo - {videoUploadLift}
              </DialogTitle>
            </DialogHeader>
            {videoUploadLift && user && truePRs[videoUploadLift] && (
              <VideoUpload
                userId={user.uid}
                liftId={truePRs[videoUploadLift]!.id!}
                existingVideoUrl={truePRs[videoUploadLift]!.videoUrl}
                onUploadComplete={() => {
                  refreshPRs();
                  setVideoUploadLift(null);
                }}
                onDelete={() => {
                  refreshPRs();
                  setVideoUploadLift(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

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
