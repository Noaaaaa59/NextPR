import { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export function SquatIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v2" />
      <path d="M4 10h16" />
      <path d="M8 10v1a4 4 0 0 0 8 0v-1" />
      <path d="M9 14l-2 6" />
      <path d="M15 14l2 6" />
      <path d="M10 14h4" />
    </svg>
  );
}

export function BenchIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2" y="14" width="20" height="3" rx="1" />
      <path d="M6 14v-2" />
      <path d="M18 14v-2" />
      <circle cx="12" cy="9" r="2" />
      <path d="M8 9h-4" />
      <path d="M20 9h-4" />
      <path d="M2 9h2" />
      <path d="M20 9h2" />
      <rect x="1" y="7" width="2" height="4" rx="0.5" />
      <rect x="21" y="7" width="2" height="4" rx="0.5" />
    </svg>
  );
}

export function DeadliftIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v5" />
      <path d="M9 11l-1 7" />
      <path d="M15 11l1 7" />
      <path d="M4 20h16" />
      <rect x="2" y="18" width="3" height="4" rx="1" />
      <rect x="19" y="18" width="3" height="4" rx="1" />
      <path d="M8 11h8" />
    </svg>
  );
}
