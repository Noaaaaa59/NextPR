'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signOut } from '@/lib/firebase/auth';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Save, Scale, Dumbbell, Calendar, Trophy, Video, Star, Pencil } from 'lucide-react';
import { Gender, getWeightCategory, WEIGHT_CATEGORIES_MALE, WEIGHT_CATEGORIES_FEMALE, PriorityLift, ThemeColor, ThemeMode, TrainingMaxPercentage, ProgramType } from '@/types/user';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { getAllStandards } from '@/lib/calculations/standards';
import { resolveThemePreferences, composeLegacyTheme } from '@/lib/theme';
import { useDashboardData } from '@/lib/hooks/useFirestoreData';
import { SquatIcon, BenchIcon, DeadliftIcon } from '@/components/icons/LiftIcons';
import { VideoUpload } from '@/components/VideoUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Experience = 'beginner' | 'intermediate' | 'advanced';
type WeightUnit = 'kg' | 'lbs';

export default function ProfilePage() {
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  const { truePRs, loading: prsLoading, refreshPRs } = useDashboardData(user?.uid);

  // isEditing only controls nom + genre
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
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
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => resolveThemePreferences(userData?.preferences).color);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => resolveThemePreferences(userData?.preferences).mode);
  const [programType, setProgramType] = useState<ProgramType>(userData?.programSettings?.programType || '531');
  const [trainingMaxPercentage, setTrainingMaxPercentage] = useState<TrainingMaxPercentage>(userData?.programSettings?.trainingMaxPercentage || 90);

  // Sync local state when userData loads/changes (fixes state reset on navigation)
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setBodyweight(userData.bodyweight?.toString() || '');
      setGender(userData.gender || 'male');
      setExperience((userData.experience as Experience) || 'beginner');
      setWeightUnit((userData.preferences?.weightUnit as WeightUnit) || 'kg');
      const resolved = resolveThemePreferences(userData.preferences);
      setThemeColor(resolved.color);
      setThemeMode(resolved.mode);
      setDaysPerWeek(userData.programSettings?.daysPerWeek || 3);
      setDurationWeeks(userData.programSettings?.durationWeeks || 4);
      setPriorityLift(userData.programSettings?.priorityLift || 'squat');
      setProgramType(userData.programSettings?.programType || '531');
      setTrainingMaxPercentage(userData.programSettings?.trainingMaxPercentage || 90);
    }
  }, [userData]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Auto-save helper for individual fields
  const saveField = async (updates: Record<string, unknown>) => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, updates);
      await refreshUserData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const savePreferences = (overrides: Partial<{ weightUnit: WeightUnit; themeColor: ThemeColor; themeMode: ThemeMode }>) => {
    const c = overrides.themeColor ?? themeColor;
    const m = overrides.themeMode ?? themeMode;
    const prefs = {
      ...(userData?.preferences ?? {}),
      weightUnit: overrides.weightUnit ?? weightUnit,
      theme: composeLegacyTheme(c, m),
      themeColor: c,
      themeMode: m,
    };
    saveField({ preferences: prefs });
  };

  const saveProgramSettings = (overrides: Record<string, unknown>) => {
    const base = {
      daysPerWeek,
      durationWeeks,
      priorityLift,
      programType,
      trainingMaxPercentage,
      ...overrides,
    };
    if (base.programType === 'linear') base.daysPerWeek = 3;
    saveField({ programSettings: base });
  };

  // Identity save (nom + genre only)
  const handleSaveIdentity = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName || userData?.displayName,
        gender,
      });
      setIsEditingIdentity(false);
      await refreshUserData();
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelIdentity = () => {
    setDisplayName(userData?.displayName || '');
    setGender(userData?.gender || 'male');
    setIsEditingIdentity(false);
  };

  // Auto-save handlers
  const handleBodyweightBlur = () => {
    const bw = parseFloat(bodyweight);
    if (bw > 0 && bw !== userData?.bodyweight) {
      saveField({ bodyweight: bw });
    }
  };

  const handleExperienceChange = (exp: Experience) => {
    setExperience(exp);
    saveField({ experience: exp });
  };

  const handleWeightUnitChange = (unit: WeightUnit) => {
    setWeightUnit(unit);
    savePreferences({ weightUnit: unit });
  };

  const applyThemeInstant = (color: ThemeColor, mode: ThemeMode) => {
    const root = document.documentElement;
    (['neutre', 'forest', 'rose', 'ocean', 'sunset'] as const).forEach(c => root.classList.remove(c));
    if (color !== 'rouge') root.classList.add(color);
    if (mode === 'auto') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', dark);
    } else {
      root.classList.toggle('dark', mode === 'dark');
    }
  };

  const handleColorChange = (c: ThemeColor) => {
    setThemeColor(c);
    applyThemeInstant(c, themeMode);
    savePreferences({ themeColor: c });
  };

  const handleModeChange = (m: ThemeMode) => {
    setThemeMode(m);
    applyThemeInstant(themeColor, m);
    savePreferences({ themeMode: m });
  };

  const handleProgramTypeChange = (type: ProgramType) => {
    setProgramType(type);
    if (type === 'linear') setDaysPerWeek(3);
    saveProgramSettings({ programType: type });
  };

  const handleDurationChange = (weeks: 4 | 6) => {
    setDurationWeeks(weeks);
    saveProgramSettings({ durationWeeks: weeks });
  };

  const handleDaysChange = (days: 3 | 4 | 5) => {
    setDaysPerWeek(days);
    saveProgramSettings({ daysPerWeek: days });
  };

  const handlePriorityChange = (lift: PriorityLift) => {
    setPriorityLift(lift);
    saveProgramSettings({ priorityLift: lift });
  };

  const handleTMChange = (tm: TrainingMaxPercentage) => {
    setTrainingMaxPercentage(tm);
    saveProgramSettings({ trainingMaxPercentage: tm });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations et préférences
        </p>
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {saveError}
        </div>
      )}

      <div className="space-y-4">
        {/* Informations personnelles */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Informations personnelles</CardTitle>
              </div>
              {!isEditingIdentity ? (
                <Button onClick={() => setIsEditingIdentity(true)} variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button onClick={handleCancelIdentity} variant="ghost" size="sm" className="h-7 text-xs">
                    Annuler
                  </Button>
                  <Button onClick={handleSaveIdentity} size="sm" className="h-7 text-xs" disabled={saving}>
                    <Save className="h-3 w-3 mr-1" />
                    {saving ? '...' : 'OK'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-foreground font-medium">Nom</Label>
                {isEditingIdentity ? (
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
                <Label className="text-foreground font-medium">Email</Label>
                <p className="text-sm font-medium py-2">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Genre</Label>
                {isEditingIdentity ? (
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
                <Label htmlFor="bodyweight" className="flex items-center gap-1 text-foreground font-medium">
                  <Scale className="h-3 w-3" />
                  Poids de corps ({weightUnit})
                </Label>
                <Input
                  id="bodyweight"
                  type="number"
                  value={bodyweight}
                  onChange={(e) => setBodyweight(e.target.value)}
                  onBlur={handleBodyweightBlur}
                  placeholder="Ex: 80"
                  min="30"
                  max="200"
                  step="0.1"
                />
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
              <Label htmlFor="experience" className="flex items-center gap-1 text-foreground font-medium">
                <Dumbbell className="h-3 w-3" />
                Expérience
              </Label>
              <div className="flex flex-wrap gap-2">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleExperienceChange(opt.value)}
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
            </div>
          </CardContent>
        </Card>

        {/* Préférences - toujours interactif */}
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
                <Label className="text-foreground font-medium">Unité de poids</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleWeightUnitChange('kg')}
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
                    onClick={() => handleWeightUnitChange('lbs')}
                    className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                      weightUnit === 'lbs'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    Livres (lbs)
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-foreground font-medium">
                <Palette className="h-3 w-3" />
                Couleur
              </Label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'rouge' as const, label: 'Rouge', dot: 'bg-red-500' },
                  { value: 'neutre' as const, label: 'Neutre', dot: 'bg-slate-400' },
                  { value: 'forest' as const, label: 'Forêt', dot: 'bg-emerald-500' },
                  { value: 'rose' as const, label: 'Rose', dot: 'bg-pink-500' },
                  { value: 'ocean' as const, label: 'Océan', dot: 'bg-cyan-500' },
                  { value: 'sunset' as const, label: 'Sunset', dot: 'bg-amber-500' },
                ]).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleColorChange(c.value)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      themeColor === c.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${c.dot}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Mode</Label>
              <div className="flex gap-2">
                {([
                  { value: 'light' as const, label: 'Clair', icon: Sun },
                  { value: 'dark' as const, label: 'Sombre', icon: Moon },
                  { value: 'auto' as const, label: 'Auto', icon: Monitor },
                ]).map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => handleModeChange(m.value)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        themeMode === m.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programme - toujours interactif */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Programme</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Méthode</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleProgramTypeChange('531')}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                    programType === '531'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  5/3/1
                </button>
                <button
                  type="button"
                  onClick={() => handleProgramTypeChange('linear')}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                    programType === 'linear'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  Linéaire
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {programType === 'linear'
                  ? 'Heavy/Medium/Light - 3 jours/semaine avec rotation des 3 lifts'
                  : 'Wendler - Progression ondulatoire avec BBB (Boring But Big)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Durée du cycle</Label>
              <div className="flex gap-2">
                {([4, 6] as const).map((weeks) => (
                  <button
                    key={weeks}
                    type="button"
                    onClick={() => handleDurationChange(weeks)}
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
            </div>

            {programType === '531' && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Jours par semaine</Label>
                <div className="flex gap-2">
                  {([3, 4, 5] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleDaysChange(days)}
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
              </div>
            )}

            {programType === '531' && daysPerWeek > 3 && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Lift prioritaire</Label>
                <div className="flex gap-2">
                  {([
                    { value: 'squat' as const, label: 'Squat' },
                    { value: 'bench' as const, label: 'Bench' },
                    { value: 'deadlift' as const, label: 'Deadlift' },
                  ]).map((lift) => (
                    <button
                      key={lift.value}
                      type="button"
                      onClick={() => handlePriorityChange(lift.value)}
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
                <p className="text-xs text-muted-foreground">
                  Ce lift sera travaillé {daysPerWeek === 4 ? '3' : '4'}x/semaine
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Training Max (%)</Label>
              <div className="flex gap-2">
                {([90, 95, 100] as const).map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleTMChange(pct)}
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

        {eliteStandards && (
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
