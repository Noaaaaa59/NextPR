'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getLeaderboard } from '@/lib/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronDown, ChevronUp, Users, Filter } from 'lucide-react';
import { SquatIcon, BenchIcon, DeadliftIcon } from '@/components/icons/LiftIcons';
import { Podium, PodiumSkeleton } from '@/components/leaderboard/Podium';
import { Gender, getWeightCategory, WeightCategory, WEIGHT_CATEGORIES_MALE, WEIGHT_CATEGORIES_FEMALE } from '@/types/user';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  bodyweight: number;
  gender?: Gender;
  squat: number;
  bench: number;
  deadlift: number;
  total: number;
}

type ViewMode = 'global' | 'category';

export default function LeaderboardPage() {
  const { user, userData } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [selectedCategory, setSelectedCategory] = useState<WeightCategory | null>(null);
  const [showFullList, setShowFullList] = useState(false);

  const userGender = userData?.gender || 'male';
  const userCategory = userData?.bodyweight ? getWeightCategory(userData.bodyweight, userGender) : null;

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboard(100);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (userCategory && !selectedCategory) {
      setSelectedCategory(userCategory);
    }
  }, [userCategory, selectedCategory]);

  const filteredLeaderboard = useMemo(() => {
    if (viewMode === 'global') {
      return leaderboard;
    }
    if (!selectedCategory) return leaderboard;

    return leaderboard.filter((entry) => {
      const entryGender = entry.gender || 'male';
      const entryCategory = getWeightCategory(entry.bodyweight, entryGender);
      return entryCategory === selectedCategory;
    });
  }, [leaderboard, viewMode, selectedCategory]);

  const getTop3 = (sortBy: 'total' | 'squat' | 'bench' | 'deadlift') => {
    const sorted = [...filteredLeaderboard].sort((a, b) => b[sortBy] - a[sortBy]);
    return [
      sorted[0] ? { displayName: sorted[0].displayName, value: sorted[0][sortBy], photoURL: sorted[0].photoURL } : null,
      sorted[1] ? { displayName: sorted[1].displayName, value: sorted[1][sortBy], photoURL: sorted[1].photoURL } : null,
      sorted[2] ? { displayName: sorted[2].displayName, value: sorted[2][sortBy], photoURL: sorted[2].photoURL } : null,
    ] as [any, any, any];
  };

  const categories = userGender === 'male' ? WEIGHT_CATEGORIES_MALE : WEIGHT_CATEGORIES_FEMALE;

  const fullList = useMemo(() => {
    return [...filteredLeaderboard].sort((a, b) => b.total - a.total);
  }, [filteredLeaderboard]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Classement</h1>
        <p className="text-sm text-muted-foreground">
          Les meilleurs PR de la communauté
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={viewMode === 'global' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('global')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Global
        </Button>
        <Button
          variant={viewMode === 'category' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('category')}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Par catégorie
        </Button>
      </div>

      {viewMode === 'category' && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Catégorie de poids :</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {cat}{cat.includes('+') ? '' : ' kg'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PodiumSkeleton />
          <PodiumSkeleton />
          <PodiumSkeleton />
          <PodiumSkeleton />
        </div>
      ) : filteredLeaderboard.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {viewMode === 'category'
                ? `Aucun lifter dans la catégorie ${selectedCategory} kg pour le moment.`
                : 'Aucun lifter dans le classement pour le moment.'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Enregistre tes lifts pour apparaître!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Podium
              title="Total"
              icon={<Trophy className="h-5 w-5 text-primary" />}
              entries={getTop3('total')}
            />
            <Podium
              title="Squat"
              icon={<SquatIcon className="h-5 w-5 text-primary" />}
              entries={getTop3('squat')}
            />
            <Podium
              title="Bench"
              icon={<BenchIcon className="h-5 w-5 text-primary" />}
              entries={getTop3('bench')}
            />
            <Podium
              title="Deadlift"
              icon={<DeadliftIcon className="h-5 w-5 text-primary" />}
              entries={getTop3('deadlift')}
            />
          </div>

          {fullList.length > 3 && (
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowFullList(!showFullList)}
                >
                  <span className="text-sm font-medium">
                    Voir le classement complet ({fullList.length} lifters)
                  </span>
                  {showFullList ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showFullList && (
                  <div className="mt-4 space-y-2">
                    {fullList.map((entry, index) => {
                      const rank = index + 1;
                      const isCurrentUser = entry.userId === user?.uid;

                      return (
                        <div
                          key={entry.userId}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            isCurrentUser ? 'bg-primary/10' : rank <= 3 ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <div className="w-8 text-center">
                            {rank <= 3 ? (
                              <span className={`font-bold ${
                                rank === 1 ? 'text-amber-400' :
                                rank === 2 ? 'text-gray-400' : 'text-amber-600'
                              }`}>
                                {rank}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">{rank}</span>
                            )}
                          </div>

                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {entry.photoURL ? (
                              <img
                                src={entry.photoURL}
                                alt={entry.displayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium">
                                {entry.displayName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                              {entry.displayName || 'Lifter anonyme'}
                              {isCurrentUser && <span className="text-xs ml-1 opacity-70">(toi)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              S: {entry.squat} | B: {entry.bench} | D: {entry.deadlift}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className={`font-bold ${rank <= 3 ? 'text-destructive' : ''}`}>
                              {entry.total}
                              <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {user && !fullList.slice(0, 3).find((e) => e.userId === user.uid) && (
            <Card className="mt-4 border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-sm text-center text-muted-foreground">
                  Tu n'es pas encore sur le podium. Continue à progresser!
                </p>
                {fullList.findIndex((e) => e.userId === user.uid) !== -1 && (
                  <p className="text-xs text-center text-primary mt-1">
                    Ta position actuelle: #{fullList.findIndex((e) => e.userId === user.uid) + 1}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
