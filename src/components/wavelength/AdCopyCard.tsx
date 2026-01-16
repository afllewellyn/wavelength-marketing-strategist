import { Copy, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AdCopy, AdVariation } from '@/types/analysis';

interface AdCopyCardProps {
  adCopy: AdCopy;
}

function AdVariationBlock({ ad, index }: { ad: AdVariation; index: number }) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    const text = `${ad.headline}\n\n${ad.hook}\n\n${ad.primaryText}\n\nCTA: ${ad.cta}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Ad copy copied to clipboard',
    });
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded">
          Variation {index + 1}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5 mr-1" />
          Copy
        </Button>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium text-muted-foreground">Headline</span>
          <p className="text-sm font-semibold">{ad.headline}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">Hook</span>
          <p className="text-sm">{ad.hook}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">Primary Text</span>
          <p className="text-sm">{ad.primaryText}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">CTA</span>
          <p className="text-sm font-medium text-primary">{ad.cta}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-border/30">
        <span className="text-xs text-muted-foreground">
          <strong>Testing Variable:</strong> {ad.testingVariable}
        </span>
      </div>
    </div>
  );
}

export function AdCopyCard({ adCopy }: AdCopyCardProps) {
  return (
    <Card className="shadow-warm border-border/50 animate-slide-up">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              {adCopy.audienceSegment}
            </CardTitle>
            <CardDescription className="mt-1">
              {adCopy.platformFormat}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {adCopy.ads.map((ad, index) => (
            <AdVariationBlock key={index} ad={ad} index={index} />
          ))}
        </div>

        {adCopy.successSignals.length > 0 && (
          <div className="p-4 bg-success/5 rounded-lg border border-success/20">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-success">
              <TrendingUp className="h-4 w-4" />
              Success Signals to Watch
            </h4>
            <ul className="grid gap-1 md:grid-cols-2">
              {adCopy.successSignals.map((signal, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <span className="text-success">✓</span>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
