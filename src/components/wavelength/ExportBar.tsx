import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatFullReport } from '@/lib/export/formatters';
import { downloadCSV } from '@/lib/export/csv';
import type { AnalysisResult } from '@/types/analysis';

interface ExportBarProps {
  result: AnalysisResult;
}

export function ExportBar({ result }: ExportBarProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatFullReport(result));
      setCopied(true);
      toast({ title: 'Copied!', description: 'Full report copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard', variant: 'destructive' });
    }
  };

  const handleDownloadCSV = () => {
    downloadCSV(result);
    toast({ title: 'Downloaded!', description: 'CSV report downloaded' });
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={handleCopyAll}>
        {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
        {copied ? 'Copied' : 'Copy Full Report'}
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
        <Download className="h-4 w-4 mr-1.5" />
        Download CSV
      </Button>
    </div>
  );
}
