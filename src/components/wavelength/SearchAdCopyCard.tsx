import { Copy, Check, Search, Link2, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SearchAdGroup, KeywordMetric, EnrichStatus } from '@/types/analysis';

interface SearchAdCopyCardProps {
  adGroup: SearchAdGroup;
  keywordMetrics?: KeywordMetric[];
  keywordStatus?: EnrichStatus;
}

// Keyword-difficulty color band: <30 green, 30-50 amber, 50+ red.
function difficultyClass(kd: number | null): string {
  if (kd == null) return 'text-muted-foreground';
  if (kd < 30) return 'text-green-600 dark:text-green-400';
  if (kd <= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function formatVolume(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(v);
}

function KeywordDemandTable({
  metrics,
  status,
}: {
  metrics: KeywordMetric[];
  status?: EnrichStatus;
}) {
  return (
    <div className="pt-2 border-t space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5" />
        Keyword Demand
        <span className="font-normal normal-case text-[10px] text-muted-foreground/70">
          (Google Keyword Planner via DataForSEO)
        </span>
      </h4>
      {status === 'error' ? (
        <p className="text-xs text-muted-foreground">
          Keyword metrics unavailable — DataForSEO quota or credentials issue.
        </p>
      ) : metrics.length === 0 ? (
        <p className="text-xs text-muted-foreground">No demand data for these keywords.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground text-left">
                <th className="font-medium py-1 pr-3">Keyword</th>
                <th className="font-medium py-1 pr-3 text-right">Volume</th>
                <th className="font-medium py-1 pr-3 text-right">CPC</th>
                <th className="font-medium py-1 text-right">KD</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-1 pr-3 font-mono">{m.keyword}</td>
                  <td className="py-1 pr-3 text-right">{formatVolume(m.volume)}</td>
                  <td className="py-1 pr-3 text-right">{m.cpc != null ? `$${m.cpc.toFixed(2)}` : '—'}</td>
                  <td className={`py-1 text-right font-semibold ${difficultyClass(m.difficulty)}`}>
                    {m.difficulty != null ? m.difficulty : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HeadlineBadge({ headline }: { headline: { text: string; charCount: number; searchTermIncluded?: string } }) {
  const isValid = headline.charCount <= 30;
  
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium flex-1">{headline.text}</p>
        <Badge 
          variant={isValid ? 'secondary' : 'destructive'}
          className="text-xs shrink-0"
        >
          {headline.charCount}/30
        </Badge>
      </div>
      {headline.searchTermIncluded && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3" />
          <span>"{headline.searchTermIncluded}"</span>
        </div>
      )}
    </div>
  );
}

function DescriptionBlock({ description }: { description: { text: string; charCount: number; searchTermIncluded?: string } }) {
  const isValid = description.charCount <= 90;
  
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm flex-1">{description.text}</p>
        <Badge 
          variant={isValid ? 'secondary' : 'destructive'}
          className="text-xs shrink-0"
        >
          {description.charCount}/90
        </Badge>
      </div>
      {description.searchTermIncluded && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3" />
          <span>"{description.searchTermIncluded}"</span>
        </div>
      )}
    </div>
  );
}

export function SearchAdCopyCard({ adGroup, keywordMetrics, keywordStatus }: SearchAdCopyCardProps) {
  const [copied, setCopied] = useState(false);

  // Metrics for just this ad group's target keywords.
  const groupKeywordSet = new Set(adGroup.targetKeywords.map((k) => k.trim().toLowerCase()));
  const groupMetrics = (keywordMetrics ?? []).filter((m) =>
    groupKeywordSet.has(m.keyword.trim().toLowerCase()),
  );

  const handleCopyAll = () => {
    const headlines = adGroup.headlines.map((h, i) => `Headline ${i + 1}: ${h.text}`).join('\n');
    const descriptions = adGroup.descriptions.map((d, i) => `Description ${i + 1}: ${d.text}`).join('\n');
    const content = `${headlines}\n\n${descriptions}`;
    
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{adGroup.audienceSegment}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {adGroup.targetKeywords.map((keyword, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyAll}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Headlines */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Headlines ({adGroup.headlines.length})
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {adGroup.headlines.map((headline, i) => (
              <HeadlineBadge key={i} headline={headline} />
            ))}
          </div>
        </div>

        {/* Descriptions */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Descriptions ({adGroup.descriptions.length})
          </h4>
          <div className="grid gap-2">
            {adGroup.descriptions.map((description, i) => (
              <DescriptionBlock key={i} description={description} />
            ))}
          </div>
        </div>

        {/* Display Path Preview */}
        {adGroup.displayPath.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Display Path Preview</p>
            <p className="text-sm font-mono text-muted-foreground">
              example.com/<span className="text-foreground">{adGroup.displayPath.join('/')}</span>
            </p>
          </div>
        )}

        {/* Keyword Demand (DataForSEO enrichment) */}
        {(keywordStatus !== undefined || groupMetrics.length > 0) && (
          <KeywordDemandTable metrics={groupMetrics} status={keywordStatus} />
        )}

        {/* Testing Notes */}
        {adGroup.testingNotes && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Testing Notes</p>
            <p className="text-sm">{adGroup.testingNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
