import { Radio } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Radio className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Wavelength</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-xl">
          Your strategic marketing assistant. Analyze any website and get decision-ready 
          audience insights and platform-native ad copy.
        </p>
      </div>
    </header>
  );
}
