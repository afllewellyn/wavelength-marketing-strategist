import { Users, Megaphone, Target, Search } from 'lucide-react';
import { WebsiteAnalysisCard } from './WebsiteAnalysisCard';
import { ICPCard } from './ICPCard';
import { AdCopyCard } from './AdCopyCard';
import { SearchAdCopyCard } from './SearchAdCopyCard';
import { TargetingStrategyCard } from './TargetingStrategyCard';
import type { AnalysisResult } from '@/types/analysis';

interface ResultsSectionProps {
  result: AnalysisResult;
}

export function ResultsSection({ result }: ResultsSectionProps) {
  const primaryICPs = result.icps.filter((icp) => icp.type === 'primary');
  const secondaryICPs = result.icps.filter((icp) => icp.type === 'secondary');
  const avoidICPs = result.icps.filter((icp) => icp.type === 'avoid');

  return (
    <div className="space-y-8">
      {/* Website Analysis */}
      <section>
        <WebsiteAnalysisCard analysis={result.websiteAnalysis} />
      </section>

      {/* ICPs */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Ideal Customer Profiles</h2>
        </div>

        {primaryICPs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Primary — Best for Paid Acquisition Now
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {primaryICPs.map((icp, i) => (
                <ICPCard key={`primary-${i}`} icp={icp} />
              ))}
            </div>
          </div>
        )}

        {secondaryICPs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Secondary — Expansion Opportunity
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {secondaryICPs.map((icp, i) => (
                <ICPCard key={`secondary-${i}`} icp={icp} />
              ))}
            </div>
          </div>
        )}

        {avoidICPs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Avoid Initially
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {avoidICPs.map((icp, i) => (
                <ICPCard key={`avoid-${i}`} icp={icp} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Targeting Strategy */}
      {result.targetingStrategy && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Platform Targeting Strategy</h2>
          </div>
          <TargetingStrategyCard strategy={result.targetingStrategy} />
        </section>
      )}

      {/* Ad Copy - Platform Aware */}
      {result.searchAdCopy && result.searchAdCopy.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Google Search Ads</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Responsive Search Ad assets optimized for your target keywords
          </p>
          <div className="space-y-4">
            {result.searchAdCopy.map((group, i) => (
              <SearchAdCopyCard key={i} adGroup={group} />
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Ad Copy</h2>
          </div>
          <div className="space-y-4">
            {result.adCopy.map((copy, i) => (
              <AdCopyCard key={i} adCopy={copy} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
