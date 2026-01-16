import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
}

const config = {
  high: {
    label: 'High Confidence',
    className: 'bg-success/10 text-success border-success/20',
  },
  medium: {
    label: 'Medium Confidence',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  low: {
    label: 'Low Confidence',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const { label, className } = config[level];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        className
      )}
    >
      {label}
    </span>
  );
}
