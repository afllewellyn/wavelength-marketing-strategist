import { Globe, Target, DollarSign, Brain, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { WebsiteAnalysis } from '@/types/analysis';

interface WebsiteAnalysisCardProps {
  analysis: WebsiteAnalysis;
}

const awarenessLabels: Record<string, string> = {
  unaware: 'Unaware',
  'problem-aware': 'Problem Aware',
  'solution-aware': 'Solution Aware',
  'product-aware': 'Product Aware',
  'most-aware': 'Most Aware',
};

export function WebsiteAnalysisCard({ analysis }: WebsiteAnalysisCardProps) {
  return (
    <Card className="shadow-warm border-border/50 animate-slide-up">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="h-5 w-5 text-primary" />
              Website & Product Analysis
            </CardTitle>
            <CardDescription className="mt-1">
              Understanding your offering and market position
            </CardDescription>
          </div>
          <ConfidenceBadge level={analysis.confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="h-4 w-4" />
              Value Proposition
            </div>
            <p className="text-foreground">{analysis.valueProposition}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Problem Solved
            </div>
            <p className="text-foreground">{analysis.problemSolved}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Brain className="h-4 w-4" />
              Target Customer Type
            </div>
            <p className="text-foreground">{analysis.targetCustomerType}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Pricing Signals
            </div>
            <p className="text-foreground">{analysis.pricingSignals}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Industry:</span>
            <span className="px-2.5 py-1 bg-secondary rounded-full text-sm font-medium">
              {analysis.industry}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Buyer Awareness:</span>
            <span className="px-2.5 py-1 bg-secondary rounded-full text-sm font-medium">
              {awarenessLabels[analysis.buyerAwarenessLevel]}
            </span>
          </div>
        </div>

        {analysis.assumptions.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Assumptions Made
            </h4>
            <ul className="space-y-1">
              {analysis.assumptions.map((assumption, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
