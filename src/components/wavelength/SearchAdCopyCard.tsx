import { Copy, Check, Search, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SearchAdGroup } from '@/types/analysis';

interface SearchAdCopyCardProps {
  adGroup: SearchAdGroup;
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

export function SearchAdCopyCard({ adGroup }: SearchAdCopyCardProps) {
  const [copied, setCopied] = useState(false);

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
