export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 10) {
    console.warn('1RM calculation is less accurate for reps > 10');
  }
  return Math.round(weight * (1 + 0.0333 * reps));
}

export function calculateBrzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight / (1.0278 - 0.0278 * reps));
}

export function calculatePercentageOfMax(oneRepMax: number, percentage: number): number {
  return Math.round(oneRepMax * (percentage / 100));
}

export function calculateRepsFromPercentage(percentage: number): number {
  if (percentage >= 95) return 1;
  if (percentage >= 90) return 3;
  if (percentage >= 85) return 5;
  if (percentage >= 80) return 7;
  if (percentage >= 75) return 9;
  if (percentage >= 70) return 11;
  return 12;
}
