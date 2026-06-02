import type { AnalysisResult, WebsiteAnalysis, ICP, TargetingStrategy, AdCopy, SearchAdGroup, KeywordMetric } from '@/types/analysis';

const awarenessLabels: Record<string, string> = {
  'unaware': 'Unaware',
  'problem-aware': 'Problem Aware',
  'solution-aware': 'Solution Aware',
  'product-aware': 'Product Aware',
  'most-aware': 'Most Aware',
};

export function formatWebsiteAnalysis(analysis: WebsiteAnalysis): string {
  const lines = [
    '📊 WEBSITE ANALYSIS',
    '═'.repeat(40),
    `Value Proposition: ${analysis.valueProposition}`,
    `Problem Solved: ${analysis.problemSolved}`,
    `Target Customer Type: ${analysis.targetCustomerType}`,
    `Industry: ${analysis.industry}`,
    `Pricing Signals: ${analysis.pricingSignals}`,
    `Buyer Awareness Level: ${awarenessLabels[analysis.buyerAwarenessLevel] || analysis.buyerAwarenessLevel}`,
    `Confidence: ${analysis.confidence}`,
  ];

  if (analysis.assumptions.length > 0) {
    lines.push('', 'Assumptions:');
    analysis.assumptions.forEach((a) => lines.push(`  • ${a}`));
  }

  return lines.join('\n');
}

export function formatICPs(icps: ICP[]): string {
  const lines = ['👥 IDEAL CUSTOMER PROFILES', '═'.repeat(40)];

  const groups: Record<string, ICP[]> = {
    primary: icps.filter((i) => i.type === 'primary'),
    secondary: icps.filter((i) => i.type === 'secondary'),
    avoid: icps.filter((i) => i.type === 'avoid'),
  };

  const groupLabels: Record<string, string> = {
    primary: 'Primary — Best for Paid Acquisition Now',
    secondary: 'Secondary — Expansion Opportunity',
    avoid: 'Avoid Initially',
  };

  for (const [type, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    lines.push('', `── ${groupLabels[type]} ──`);
    items.forEach((icp) => {
      lines.push(
        '',
        `  ${icp.name}`,
        `  Age: ${icp.demographics.ageRange} | Gender: ${icp.demographics.gender} | Location: ${icp.demographics.location}`,
        `  Income: ${icp.demographics.income} | Education: ${icp.demographics.education}`,
        `  Job Titles: ${icp.jobTitles.join(', ')}`,
        `  Pain Points: ${icp.painPoints.join(', ')}`,
        `  Emotional Drivers: ${icp.emotionalDrivers.join(', ')}`,
        `  Behavioral Traits: ${icp.behavioralTraits.join(', ')}`,
        `  Values: ${icp.psychographics.values.join(', ')}`,
        `  Interests: ${icp.psychographics.interests.join(', ')}`,
        `  Lifestyle: ${icp.psychographics.lifestyle}`,
        `  Reasoning: ${icp.reasoning}`,
      );
    });
  }

  return lines.join('\n');
}

export function formatTargetingStrategy(strategy: TargetingStrategy): string {
  const lines = ['🎯 PLATFORM TARGETING STRATEGY', '═'.repeat(40)];

  lines.push(`Platform: ${strategy.platform}`);
  lines.push(`Funnel Stage: ${strategy.funnelStage}`);
  lines.push(`Funnel Reasoning: ${strategy.funnelReasoning}`);

  if (strategy.audienceTypes.length > 0) {
    lines.push('', 'Audiences:');
    strategy.audienceTypes.forEach((a) =>
      lines.push(`  [${a.priority}] ${a.type}: ${a.description}`)
    );
  }

  if (strategy.interests.length > 0) {
    lines.push('', `Interests: ${strategy.interests.join(', ')}`);
  }
  if (strategy.behaviors.length > 0) {
    lines.push(`Behaviors: ${strategy.behaviors.join(', ')}`);
  }
  if (strategy.keywords && strategy.keywords.length > 0) {
    lines.push(`Keywords: ${strategy.keywords.join(', ')}`);
  }

  // Meta audience reach (enrichment)
  if (strategy.metaReachEstimate) {
    const m = strategy.metaReachEstimate;
    lines.push(
      '',
      `Estimated Audience Reach (Meta): ${m.audienceSize.lower.toLocaleString()} – ${m.audienceSize.upper.toLocaleString()} people [${m.suggestion}]`,
    );
    const unmatched = m.resolvedInterests.filter((r) => !r.matched).map((r) => r.name);
    if (unmatched.length > 0) {
      lines.push(`  Interests with no Meta match: ${unmatched.join(', ')}`);
    }
  }

  if (strategy.communities && strategy.communities.length > 0) {
    if (strategy.communityMetrics && strategy.communityMetrics.length > 0) {
      const withSubs = strategy.communityMetrics
        .map((c) => `r/${c.name}${c.subscribers != null ? ` (${c.subscribers.toLocaleString()} subs)` : ''}`)
        .join(', ');
      lines.push(`Communities: ${withSubs}`);
    } else {
      lines.push(`Communities: ${strategy.communities.join(', ')}`);
    }
  }

  // TikTok interest-category matches (enrichment)
  if (strategy.tiktokInterestMatches && strategy.tiktokInterestMatches.length > 0) {
    const unmatched = strategy.tiktokInterestMatches.filter((m) => !m.matched).map((m) => m.name);
    if (unmatched.length > 0) {
      lines.push(`TikTok interests with no category match: ${unmatched.join(', ')}`);
    }
  }
  if (strategy.linkedinTargeting) {
    const lt = strategy.linkedinTargeting;
    lines.push('', 'LinkedIn Targeting:');
    if (lt.jobTitles.length) lines.push(`  Job Titles: ${lt.jobTitles.join(', ')}`);
    if (lt.skills.length) lines.push(`  Skills: ${lt.skills.join(', ')}`);
    if (lt.companies.length) lines.push(`  Companies: ${lt.companies.join(', ')}`);
    if (lt.industries.length) lines.push(`  Industries: ${lt.industries.join(', ')}`);
    if (lt.groups.length) lines.push(`  Groups: ${lt.groups.join(', ')}`);
  }
  if (strategy.placements.length > 0) {
    lines.push(`Placements: ${strategy.placements.join(', ')}`);
  }
  if (strategy.exclusions.length > 0) {
    lines.push(`Exclusions: ${strategy.exclusions.join(', ')}`);
  }
  if (strategy.platformNotes) {
    lines.push('', `Platform Notes: ${strategy.platformNotes}`);
  }

  return lines.join('\n');
}

export function formatAdCopy(
  adCopy: AdCopy[],
  searchAdCopy?: SearchAdGroup[],
  keywordMetrics?: KeywordMetric[],
): string {
  const lines = ['📝 AD COPY', '═'.repeat(40)];

  if (searchAdCopy && searchAdCopy.length > 0) {
    const metricByKeyword = new Map(
      (keywordMetrics ?? []).map((m) => [m.keyword.trim().toLowerCase(), m]),
    );
    lines.push('', '── Google Search Ads ──');
    searchAdCopy.forEach((group) => {
      lines.push(
        '',
        `  Audience: ${group.audienceSegment}`,
        `  Keywords: ${group.targetKeywords.join(', ')}`,
        `  Display Path: ${group.displayPath.join('/')}`,
        '',
        '  Headlines:',
      );
      group.headlines.forEach((h) => lines.push(`    • ${h.text} (${h.charCount} chars)`));
      lines.push('', '  Descriptions:');
      group.descriptions.forEach((d) => lines.push(`    • ${d.text} (${d.charCount} chars)`));
      const groupMetrics = group.targetKeywords
        .map((k) => metricByKeyword.get(k.trim().toLowerCase()))
        .filter((m): m is KeywordMetric => !!m);
      if (groupMetrics.length > 0) {
        lines.push('', '  Keyword Demand (DataForSEO):');
        groupMetrics.forEach((m) =>
          lines.push(
            `    • ${m.keyword}: vol ${m.volume ?? '—'}, CPC ${m.cpc != null ? `$${m.cpc.toFixed(2)}` : '—'}, KD ${m.difficulty ?? '—'}`,
          ),
        );
      }
      if (group.testingNotes) {
        lines.push(`  Testing Notes: ${group.testingNotes}`);
      }
    });
  } else {
    adCopy.forEach((copy) => {
      lines.push(
        '',
        `── ${copy.audienceSegment} (${copy.platformFormat}) ──`,
      );
      copy.ads.forEach((ad, i) => {
        lines.push(
          '',
          `  Variation ${i + 1}:`,
          `    Headline: ${ad.headline}`,
          `    Hook: ${ad.hook}`,
          `    Primary Text: ${ad.primaryText}`,
          `    CTA: ${ad.cta}`,
          `    Testing Variable: ${ad.testingVariable}`,
        );
      });
      if (copy.successSignals.length > 0) {
        lines.push('', '  Success Signals:');
        copy.successSignals.forEach((s) => lines.push(`    ✓ ${s}`));
      }
    });
  }

  return lines.join('\n');
}

export function formatFullReport(result: AnalysisResult): string {
  const sections = [
    formatWebsiteAnalysis(result.websiteAnalysis),
    '',
    formatICPs(result.icps),
    '',
    formatTargetingStrategy(result.targetingStrategy),
    '',
    formatAdCopy(result.adCopy, result.searchAdCopy, result.keywordMetrics),
  ];

  return sections.join('\n');
}
