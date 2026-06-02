import { Target, Zap, Ban, Lightbulb, Users, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TargetingStrategy } from '@/types/analysis';

interface TargetingStrategyCardProps {
  strategy: TargetingStrategy;
  /** Job titles the user uploaded (LinkedIn), used to flag grounded suggestions. */
  uploadedJobTitles?: string[];
}

function formatCount(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

const reachSuggestionMeta: Record<string, { label: string; className: string; note: string }> = {
  'too-narrow': {
    label: 'Too Narrow',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    note: 'This audience may be too small for efficient Meta delivery — broaden interests or geo.',
  },
  healthy: {
    label: 'Healthy',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    note: 'This audience is in a healthy size range for Meta cold prospecting.',
  },
  'too-broad': {
    label: 'Too Broad',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    note: 'This audience is very large — tighten with behaviors or stack interests to focus spend.',
  },
};

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

export function TargetingStrategyCard({ strategy, uploadedJobTitles }: TargetingStrategyCardProps) {
  const uploadedTitleSet = new Set((uploadedJobTitles ?? []).map((t) => t.toLowerCase()));
  const matchedTitleCount = (strategy.linkedinTargeting?.jobTitles ?? []).filter((t) =>
    uploadedTitleSet.has(t.toLowerCase()),
  ).length;
  const funnel = funnelLabels[strategy.funnelStage] || {
    label: strategy.funnelStage || 'Unknown',
    className: 'bg-muted text-muted-foreground'
  };

  // Enrichment lookups: which interests matched the platform's real library.
  const metaInterestMatch = new Map(
    (strategy.metaReachEstimate?.resolvedInterests ?? []).map((r) => [r.name.toLowerCase(), r.matched]),
  );
  const tiktokInterestMatch = new Map(
    (strategy.tiktokInterestMatches ?? []).map((m) => [m.name.toLowerCase(), m.matched]),
  );
  const interestMatchFor = (interest: string): boolean | undefined => {
    if (strategy.platform === 'meta' && strategy.metaReachEstimate) {
      return metaInterestMatch.get(interest.toLowerCase()) ?? false;
    }
    if (strategy.platform === 'tiktok' && strategy.tiktokInterestMatches) {
      return tiktokInterestMatch.get(interest.toLowerCase()) ?? false;
    }
    return undefined;
  };

  const subscribersFor = new Map(
    (strategy.communityMetrics ?? []).map((c) => [c.name.replace(/^r\//i, '').toLowerCase(), c.subscribers]),
  );

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
              {strategy.interests.map((interest, i) => {
                const matched = interestMatchFor(interest);
                return (
                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                    {interest}
                    {matched === true && <Check className="h-3 w-3 text-green-600 dark:text-green-400" />}
                    {matched === false && (
                      <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    )}
                  </Badge>
                );
              })}
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

        {/* Estimated Audience Reach (Meta only) */}
        {strategy.platform === 'meta' && strategy.metaReachEstimate && (
          <div className="rounded-lg border bg-background/50 p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Estimated Audience Reach
              </h4>
              <Badge className={reachSuggestionMeta[strategy.metaReachEstimate.suggestion]?.className}>
                {reachSuggestionMeta[strategy.metaReachEstimate.suggestion]?.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground/70">Meta Marketing API</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {formatCount(strategy.metaReachEstimate.audienceSize.lower)} –{' '}
              {formatCount(strategy.metaReachEstimate.audienceSize.upper)}
              <span className="text-sm font-normal text-muted-foreground"> people</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {reachSuggestionMeta[strategy.metaReachEstimate.suggestion]?.note}
            </p>
            <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" /> confirmed on Meta
              <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 ml-2" /> LLM assumption — verify/swap
            </p>
          </div>
        )}

        {/* Real audiences Meta suggests (the headline "real vs assumed" unlock) */}
        {strategy.platform === 'meta' &&
          strategy.metaReachEstimate?.suggestedInterests &&
          strategy.metaReachEstimate.suggestedInterests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Meta Suggests These Real Audiences
              </h4>
              <p className="text-xs text-muted-foreground">
                Genuinely targetable Meta interests for this audience — swap in for any ⚠ assumptions above.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {strategy.metaReachEstimate.suggestedInterests.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-primary/30 text-primary">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* TikTok interest-match legend */}
        {strategy.platform === 'tiktok' && strategy.tiktokInterestMatches && (
          <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" /> matched a TikTok interest category
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 ml-2" /> no TikTok category match
          </p>
        )}

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
            <h4 className="text-sm font-semibold text-foreground">
              Subreddits to Target
              {strategy.communityMetrics && (
                <span className="ml-2 text-[10px] font-normal text-muted-foreground/70">
                  subscriber counts via Reddit
                </span>
              )}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {strategy.communities.map((community, i) => {
                const clean = community.replace(/^r\//, '');
                const subs = subscribersFor.get(clean.toLowerCase());
                return (
                  <Badge key={i} variant="outline" className="text-xs gap-1.5">
                    r/{clean}
                    {subs != null && (
                      <span className="text-muted-foreground">· {formatCount(subs)}</span>
                    )}
                    {strategy.communityMetrics && subs == null && (
                      <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* LinkedIn Targeting (for LinkedIn only) */}
        {strategy.linkedinTargeting && strategy.platform === 'linkedin' && (
          <div className="space-y-4">
            {strategy.linkedinTargeting.jobTitles?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Job Titles
                  {uploadedTitleSet.size > 0 && (
                    <span className="ml-2 text-[10px] font-normal text-muted-foreground/70">
                      {matchedTitleCount} of {uploadedTitleSet.size} uploaded titles matched
                    </span>
                  )}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.linkedinTargeting.jobTitles.map((title, i) => {
                    const grounded = uploadedTitleSet.size > 0 && uploadedTitleSet.has(title.toLowerCase());
                    return (
                      <Badge key={i} variant="secondary" className="text-xs gap-1">
                        {title}
                        {grounded && <Check className="h-3 w-3 text-green-600 dark:text-green-400" />}
                      </Badge>
                    );
                  })}
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
