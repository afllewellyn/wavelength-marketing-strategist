import type { AnalysisResult } from '@/types/analysis';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(...cells: string[]): string {
  return cells.map(escapeCSV).join(',');
}

export function generateReportCSV(result: AnalysisResult): string {
  const lines: string[] = [];

  // Website Analysis
  lines.push(row('Section', 'Field', 'Value'));
  const wa = result.websiteAnalysis;
  lines.push(row('Website Analysis', 'Value Proposition', wa.valueProposition));
  lines.push(row('Website Analysis', 'Problem Solved', wa.problemSolved));
  lines.push(row('Website Analysis', 'Target Customer Type', wa.targetCustomerType));
  lines.push(row('Website Analysis', 'Industry', wa.industry));
  lines.push(row('Website Analysis', 'Pricing Signals', wa.pricingSignals));
  lines.push(row('Website Analysis', 'Buyer Awareness Level', wa.buyerAwarenessLevel));
  lines.push(row('Website Analysis', 'Confidence', wa.confidence));
  if (wa.assumptions.length > 0) {
    lines.push(row('Website Analysis', 'Assumptions', wa.assumptions.join('; ')));
  }
  lines.push('');

  // ICPs
  lines.push(row('Section', 'Name', 'Type', 'Age Range', 'Gender', 'Location', 'Income', 'Education', 'Job Titles', 'Pain Points', 'Emotional Drivers', 'Behavioral Traits', 'Reasoning'));
  result.icps.forEach((icp) => {
    lines.push(row(
      'ICP',
      icp.name,
      icp.type,
      icp.demographics.ageRange,
      icp.demographics.gender,
      icp.demographics.location,
      icp.demographics.income,
      icp.demographics.education,
      icp.jobTitles.join('; '),
      icp.painPoints.join('; '),
      icp.emotionalDrivers.join('; '),
      icp.behavioralTraits.join('; '),
      icp.reasoning,
    ));
  });
  lines.push('');

  // Targeting Strategy
  const ts = result.targetingStrategy;
  lines.push(row('Section', 'Field', 'Value'));
  lines.push(row('Targeting', 'Platform', ts.platform));
  lines.push(row('Targeting', 'Funnel Stage', ts.funnelStage));
  lines.push(row('Targeting', 'Funnel Reasoning', ts.funnelReasoning));
  lines.push(row('Targeting', 'Interests', ts.interests.join('; ')));
  lines.push(row('Targeting', 'Behaviors', ts.behaviors.join('; ')));
  if (ts.keywords?.length) lines.push(row('Targeting', 'Keywords', ts.keywords.join('; ')));
  lines.push(row('Targeting', 'Placements', ts.placements.join('; ')));
  lines.push(row('Targeting', 'Exclusions', ts.exclusions.join('; ')));
  if (ts.platformNotes) lines.push(row('Targeting', 'Platform Notes', ts.platformNotes));
  lines.push('');

  // Ad Copy
  if (result.searchAdCopy && result.searchAdCopy.length > 0) {
    lines.push(row('Section', 'Audience Segment', 'Keywords', 'Headline/Description', 'Text', 'Char Count'));
    result.searchAdCopy.forEach((group) => {
      group.headlines.forEach((h) => {
        lines.push(row('Search Ad', group.audienceSegment, group.targetKeywords.join('; '), 'Headline', h.text, String(h.charCount)));
      });
      group.descriptions.forEach((d) => {
        lines.push(row('Search Ad', group.audienceSegment, group.targetKeywords.join('; '), 'Description', d.text, String(d.charCount)));
      });
    });
  } else {
    lines.push(row('Section', 'Audience Segment', 'Platform Format', 'Variation', 'Headline', 'Hook', 'Primary Text', 'CTA', 'Testing Variable'));
    result.adCopy.forEach((copy) => {
      copy.ads.forEach((ad, i) => {
        lines.push(row(
          'Ad Copy',
          copy.audienceSegment,
          copy.platformFormat,
          String(i + 1),
          ad.headline,
          ad.hook,
          ad.primaryText,
          ad.cta,
          ad.testingVariable,
        ));
      });
    });
  }

  return lines.join('\n');
}

export function downloadCSV(result: AnalysisResult): void {
  const csv = generateReportCSV(result);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `wavelength-report-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
