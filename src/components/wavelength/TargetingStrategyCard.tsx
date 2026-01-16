import { Target, Zap, Ban, Lightbulb, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TargetingStrategy } from '@/types/analysis';

interface TargetingStrategyCardProps {
  strategy: TargetingStrategy;
}

const platformLabels: Record<string, string> = {
  meta: 'Meta Ads',
  tiktok: 'TikTok Ads',
  youtube: 'YouTube Ads',
  reddit: 'Reddit Ads',
  linkedin: 'LinkedIn Ads',
  google: 'Google Ads',
};

const funnelLabels: Record<string, { label: string; className: string }> = {
  cold: { label: 'Cold Traffic', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  warm: { label: 'Warm Traffic', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  retargeting: { label: 'Retargeting', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

export function TargetingStrategyCard({ strategy }: TargetingStrategyCardProps) {
  const funnel = funnelLabels[strategy.funnelStage] || { 
    label: strategy.funnelStage || 'Unknown', 
    className: 'bg-muted text-muted-foreground' 
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Platform Targeting Strategy
          </CardTitle>
          <Badge variant="secondary" className="text-sm font-medium">
            {platformLabels[strategy.platform] || strategy.platform}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audience Types */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Recommended Audiences</h4>
          <div className="space-y-2">
            {strategy.audienceTypes.map((audience, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border bg-background/50 p-3">
                <Badge 
                  variant={audience.priority === 'primary' ? 'default' : 'outline'}
                  className="shrink-0 mt-0.5"
                >
                  {audience.priority === 'primary' ? 'Primary' : 'Test'}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{audience.type}</p>
                  <p className="text-sm text-muted-foreground">{audience.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interests & Behaviors */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Interests
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {strategy.interests.map((interest, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Behaviors
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {strategy.behaviors.map((behavior, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {behavior}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Keywords (for Google/YouTube/Reddit only) */}
        {strategy.keywords && strategy.keywords.length > 0 && 
         ['google', 'youtube', 'reddit'].includes(strategy.platform) && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {strategy.keywords.map((keyword, i) => (
                <Badge key={i} variant="outline" className="text-xs font-mono">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Subreddits (for Reddit only) */}
        {strategy.communities && strategy.communities.length > 0 && 
         strategy.platform === 'reddit' && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Subreddits to Target</h4>
            <div className="flex flex-wrap gap-1.5">
              {strategy.communities.map((community, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  r/{community.replace(/^r\//, '')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* LinkedIn Targeting (for LinkedIn only) */}
        {strategy.linkedinTargeting && strategy.platform === 'linkedin' && (
          <div className="space-y-4">
            {strategy.linkedinTargeting.jobTitles?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Job Titles</h4>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.linkedinTargeting.jobTitles.map((title, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {strategy.linkedinTargeting.skills?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Member Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.linkedinTargeting.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {strategy.linkedinTargeting.companies?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Companies / Company Sizes</h4>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.linkedinTargeting.companies.map((company, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {strategy.linkedinTargeting.industries?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Industries</h4>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.linkedinTargeting.industries.map((industry, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {strategy.linkedinTargeting.groups?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">LinkedIn Groups</h4>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.linkedinTargeting.groups.map((group, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Placements */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Placements</h4>
          <div className="flex flex-wrap gap-1.5">
            {strategy.placements.map((placement, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {placement}
              </Badge>
            ))}
          </div>
        </div>

        {/* Exclusions */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Ban className="h-4 w-4 text-destructive" />
            Exclusions
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {strategy.exclusions.map((exclusion, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="text-xs border-destructive/30 text-destructive"
              >
                {exclusion}
              </Badge>
            ))}
          </div>
        </div>

        {/* Funnel Stage */}
        <div className="rounded-lg border bg-background/50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Funnel Stage</h4>
            <Badge className={funnel.className}>{funnel.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{strategy.funnelReasoning}</p>
        </div>

        {/* Budget Recommendation */}
        {strategy.budgetRecommendation && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-1">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-primary" />
              Budget Recommendation
            </h4>
            <p className="text-sm text-muted-foreground">
              Minimum daily budget: <span className="font-medium text-foreground">{strategy.budgetRecommendation.dailyMin}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Test duration: <span className="font-medium text-foreground">{strategy.budgetRecommendation.testDuration}</span>
            </p>
          </div>
        )}

        {/* Platform Notes */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 space-y-1">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" />
            Platform Tips
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">{strategy.platformNotes}</p>
        </div>
      </CardContent>
    </Card>
  );
}
