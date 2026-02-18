
## Add Export Functionality to Report

### Overview
Add two levels of export:
1. **Per-section "Copy" buttons** on each report section header (Website Analysis, ICPs, Targeting Strategy, Ad Copy)
2. **"Export Full Report" button** at the top of results with two options: Copy All to Clipboard and Download as CSV

---

### New Files

#### 1. `src/lib/export/formatters.ts`
Utility functions to convert each section's data into readable plain text for clipboard copying:
- `formatWebsiteAnalysis(analysis)` - formats value prop, problem, customer type, industry, etc.
- `formatICPs(icps)` - formats each ICP with demographics, job titles, pain points, emotional drivers
- `formatTargetingStrategy(strategy)` - formats audiences, interests, behaviors, keywords, placements, exclusions
- `formatAdCopy(adCopy, searchAdCopy)` - formats ad variations with headlines, hooks, CTAs
- `formatFullReport(result)` - combines all sections into one formatted text block

#### 2. `src/lib/export/csv.ts`
Functions to convert the full report into CSV format with multiple logical sections:
- `generateReportCSV(result)` - produces a downloadable CSV string
- CSV structure will use section headers as row separators and flatten nested data into columns
- Handles the different data shapes (website analysis as key-value rows, ICPs as one row per ICP, ad copy as one row per variation, etc.)
- Triggers browser download via `Blob` + temporary anchor element

#### 3. `src/components/wavelength/SectionCopyButton.tsx`
A small reusable button component that accepts text content and copies to clipboard with toast feedback. Styled to sit in section headers without being visually heavy (ghost/outline style with a Copy icon).

#### 4. `src/components/wavelength/ExportBar.tsx`
A bar rendered at the top of the results section with:
- "Copy Full Report" button (copies all sections as formatted text)
- "Download CSV" button (triggers CSV file download)
- Uses `DropdownMenu` or two side-by-side buttons

---

### Modified Files

#### 5. `src/components/wavelength/ResultsSection.tsx`
- Import `ExportBar` and `SectionCopyButton`
- Add `ExportBar` at the top of the results, passing the full `result` object
- Add `SectionCopyButton` next to each section heading (Website Analysis, ICPs, Targeting Strategy, Ad Copy)
- Each button calls the appropriate formatter function from `formatters.ts`

---

### CSV Structure

The CSV will be organized into labeled sections:

```text
Section,Field,Value
Website Analysis,Value Proposition,"..."
Website Analysis,Problem Solved,"..."
Website Analysis,Industry,"..."
...

Section,Name,Type,Age Range,Gender,Location,Income,Job Titles,Pain Points,Emotional Drivers,Reasoning
ICPs,Enterprise Biotech Leaders,primary,35-55,All,US/EU,$120k+,"VP R&D, Director","Budget constraints, Slow processes","Innovation, Efficiency","..."
...

Section,Audience Segment,Platform Format,Headline,Hook,Primary Text,CTA,Testing Variable
Ad Copy,Enterprise Biotech,LinkedIn Single Image,"...","...","...","...","..."
...
```

---

### Technical Details

- No new dependencies needed -- uses native `navigator.clipboard.writeText()` and `Blob`/`URL.createObjectURL` for CSV download
- CSV filename format: `wavelength-report-YYYY-MM-DD.csv`
- Toast notifications for clipboard copy success/failure
- All formatting is client-side only, no backend changes
