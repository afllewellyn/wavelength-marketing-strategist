import { Users, UserX, UserPlus, Briefcase, Heart, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ICP } from '@/types/analysis';

interface ICPCardProps {
  icp: ICP;
}

const typeConfig = {
  primary: {
    icon: UserPlus,
    label: 'Primary ICP',
    borderClass: 'border-l-4 border-l-success',
    badgeClass: 'bg-success/10 text-success',
  },
  secondary: {
    icon: Users,
    label: 'Secondary ICP',
    borderClass: 'border-l-4 border-l-info',
    badgeClass: 'bg-info/10 text-info',
  },
  avoid: {
    icon: UserX,
    label: 'Avoid',
    borderClass: 'border-l-4 border-l-destructive',
    badgeClass: 'bg-destructive/10 text-destructive',
  },
};

export function ICPCard({ icp }: ICPCardProps) {
  const config = typeConfig[icp.type];
  const Icon = config.icon;

  return (
    <Card className={cn('shadow-warm border-border/50 animate-slide-up', config.borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            {icp.name}
          </CardTitle>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', config.badgeClass)}>
            {config.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demographics */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Demographics
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Age: </span>
              <span>{icp.demographics.ageRange}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gender: </span>
              <span>{icp.demographics.gender}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location: </span>
              <span>{icp.demographics.location}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Income: </span>
              <span>{icp.demographics.income}</span>
            </div>
          </div>
        </div>

        {/* Job Titles */}
        {icp.jobTitles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Job Titles
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {icp.jobTitles.map((title, i) => (
                <span key={i} className="px-2 py-1 bg-secondary rounded-md text-sm">
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pain Points */}
        {icp.painPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Pain Points
            </h4>
            <ul className="space-y-1">
              {icp.painPoints.map((point, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Emotional Drivers */}
        {icp.emotionalDrivers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Emotional Drivers
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {icp.emotionalDrivers.map((driver, i) => (
                <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                  {driver}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-sm text-muted-foreground italic">{icp.reasoning}</p>
        </div>
      </CardContent>
    </Card>
  );
}
