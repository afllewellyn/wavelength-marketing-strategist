import type { AnalysisResult, WebsiteAnalysis, ICP, TargetingStrategy, AdCopy, SearchAdGroup } from '@/types/analysis';

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
  if (strategy.communities && strategy.communities.length > 0) {
    lines.push(`Communities: ${strategy.communities.join(', ')}`);
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

  if (strategy.metaAudience && strategy.metaAudience.length > 0) {
    lines.push('', 'Meta Audience Selections (from Ads Manager targeting library):');
    strategy.metaAudience.forEach((s) => {
      const size = s.matched
        ? `${s.audienceSize.lower.toLocaleString()} – ${s.audienceSize.upper.toLocaleString()} (worldwide)`
        : 'no match found';
      lines.push(`  [${s.matched ? '✓' : '⚠'}] (${s.type}) ${s.name}: ${size}`);
    });
    if (strategy.metaAudienceSize) {
      lines.push(
        `  Estimated Combined Reach (US default — re-estimate in Ads Manager for other countries): ${strategy.metaAudienceSize.lower.toLocaleString()} – ${strategy.metaAudienceSize.upper.toLocaleString()}`
      );
    }
    if (strategy.metaAudienceSuggestion) {
      lines.push(`  Audience Size Suggestion: ${strategy.metaAudienceSuggestion}`);
    }
  } else if (strategy.metaAudienceError) {
    lines.push('', `Meta Audience Validation: unavailable (${strategy.metaAudienceError})`);
  }

  if (strategy.keywordMetrics && strategy.keywordMetrics.length > 0) {
    lines.push('', 'Real Keyword Demand (via DataForSEO):');
    strategy.keywordMetrics.forEach((m) => {
      const volume = m.volume !== null ? m.volume.toLocaleString() : 'unavailable';
      const cpc = m.cpc !== null ? `$${m.cpc.toFixed(2)}` : 'unavailable';
      const competition = m.competition !== null ? `${Math.round(m.competition * 100)}%` : 'unavailable';
      lines.push(`  ${m.keyword}: ${volume}/mo, ${cpc} CPC, ${competition} competition`);
    });
  } else if (strategy.keywordMetricsError) {
    lines.push('', `Keyword Demand Data: unavailable (${strategy.keywordMetricsError})`);
  }

  if (strategy.youtubeAudience && strategy.youtubeAudience.length > 0) {
    lines.push('', 'YouTube Audience Selections (from Google Ads audience catalogs):');
    strategy.youtubeAudience.forEach((s) => {
      const status = s.matched ? (s.category ?? 'matched') : 'no match found';
      lines.push(`  [${s.matched ? '✓' : '⚠'}] (${s.type}) ${s.name}: ${status}`);
    });
  } else if (strategy.youtubeAudienceError) {
    lines.push('', `YouTube Audience Validation: unavailable (${strategy.youtubeAudienceError})`);
  }

  return lines.join('\n');
}

export function formatAdCopy(adCopy: AdCopy[], searchAdCopy?: SearchAdGroup[]): string {
  const lines = ['📝 AD COPY', '═'.repeat(40)];

  if (searchAdCopy && searchAdCopy.length > 0) {
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
    formatAdCopy(result.adCopy, result.searchAdCopy),
  ];

  return sections.join('\n');
}
