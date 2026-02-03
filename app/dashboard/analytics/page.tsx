'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getLifts, getPersonalRecord } from '@/lib/firebase/firestore';
import { getStrengthLevel, getAllStandards, calculateWilksScore } from '@/lib/calculations/standards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressionChart } from '@/components/charts/ProgressionChart';
import { StrengthStandardsChart } from '@/components/charts/StrengthStandardsChart';
import { Lift } from '@/types/workout';
import { StrengthLevel } from '@/types/analytics';
import { TrendingUp, Target, Award, Scale } from 'lucide-react';
import { SquatIcon, BenchIcon, DeadliftIcon } from '@/components/icons/LiftIcons';
import { getWeightCategory } from '@/types/user';

interface ExerciseData {
  lifts: Lift[];
  pr: Lift | null;
  level: StrengthLevel;
  standards: Record<StrengthLevel, number>;
}

export default function AnalyticsPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [squatData, setSquatData] = useState<ExerciseData | null>(null);
  const [benchData, setBenchData] = useState<ExerciseData | null>(null);
  const [deadliftData, setDeadliftData] = useState<ExerciseData | null>(null);

  const bodyweight = userData?.bodyweight || 80;
  const gender = userData?.gender || 'male';
  const category = getWeightCategory(bodyweight, gender);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      const [
        squatLifts, benchLifts, deadliftLifts,
        squatPR, benchPR, deadliftPR
      ] = await Promise.all([
        getLifts(user.uid, 'squat'),
        getLifts(user.uid, 'bench'),
        getLifts(user.uid, 'deadlift'),
        getPersonalRecord(user.uid, 'squat'),
        getPersonalRecord(user.uid, 'bench'),
        getPersonalRecord(user.uid, 'deadlift'),
      ]);

      const squatWeight = squatPR?.weight || 0;
      const benchWeight = benchPR?.weight || 0;
      const deadliftWeight = deadliftPR?.weight || 0;

      setSquatData({
        lifts: squatLifts,
        pr: squatPR,
        level: getStrengthLevel('squat', squatWeight, bodyweight, gender),
        standards: getAllStandards('squat', bodyweight, gender),
      });

      setBenchData({
        lifts: benchLifts,
        pr: benchPR,
        level: getStrengthLevel('bench', benchWeight, bodyweight, gender),
        standards: getAllStandards('bench', bodyweight, gender),
      });

      setDeadliftData({
        lifts: deadliftLifts,
        pr: deadliftPR,
        level: getStrengthLevel('deadlift', deadliftWeight, bodyweight, gender),
        standards: getAllStandards('deadlift', bodyweight, gender),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, bodyweight, gender]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, loadAnalytics]);

  const totalPR = (squatData?.pr?.weight || 0) + (benchData?.pr?.weight || 0) + (deadliftData?.pr?.weight || 0);
  const wilksScore = totalPR > 0 ? calculateWilksScore(totalPR, bodyweight, gender === 'male') : 0;

  const formatChartData = (lifts: Lift[]) => {
    return lifts
      .map((lift) => ({
        date: lift.date?.toDate ? lift.date.toDate() : new Date(lift.date as any),
        weight: lift.weight,
        reps: lift.reps,
        estimatedMax: lift.estimatedMax,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const renderExerciseCard = (
    title: string,
    Icon: React.ComponentType<{ className?: string }>,
    data: ExerciseData | null,
    exercise: 'squat' | 'bench' | 'deadlift'
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Chargement...
          </div>
        ) : data && data.lifts.length > 0 ? (
          <ProgressionChart
            data={formatChartData(data.lifts)}
            showEstimated={true}
          />
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Aucune donnée - Logge ton premier {title.toLowerCase()}!
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Statistiques</h1>
        <p className="text-sm text-muted-foreground">
          Analyse ta progression et compare-toi aux standards
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="text-xl font-bold text-primary">
              {loading ? '...' : totalPR > 0 ? `${totalPR} kg` : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Wilks</span>
            </div>
            <div className="text-xl font-bold">
              {loading ? '...' : wilksScore > 0 ? wilksScore.toFixed(1) : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Catégorie</span>
            </div>
            <div className="text-xl font-bold">
              {category}{category.includes('+') ? '' : ' kg'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Séances</span>
            </div>
            <div className="text-xl font-bold">
              {loading ? '...' : (squatData?.lifts.length || 0) + (benchData?.lifts.length || 0) + (deadliftData?.lifts.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {renderExerciseCard('Squat', SquatIcon, squatData, 'squat')}
        {renderExerciseCard('Bench Press', BenchIcon, benchData, 'bench')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {renderExerciseCard('Deadlift', DeadliftIcon, deadliftData, 'deadlift')}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Standards de Force</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <>
                {squatData && (
                  <StrengthStandardsChart
                    exercise="squat"
                    currentWeight={squatData.pr?.weight || 0}
                    standards={squatData.standards}
                    currentLevel={squatData.level}
                  />
                )}
                {benchData && (
                  <StrengthStandardsChart
                    exercise="bench"
                    currentWeight={benchData.pr?.weight || 0}
                    standards={benchData.standards}
                    currentLevel={benchData.level}
                  />
                )}
                {deadliftData && (
                  <StrengthStandardsChart
                    exercise="deadlift"
                    currentWeight={deadliftData.pr?.weight || 0}
                    standards={deadliftData.standards}
                    currentLevel={deadliftData.level}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {bodyweight === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Configure ton poids de corps dans ton profil pour obtenir des standards de force précis!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
