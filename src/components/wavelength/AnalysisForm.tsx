import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AnalysisInput, Platform } from '@/types/analysis';

const formSchema = z.object({
  websiteUrl: z.string().url('Please enter a valid URL').or(z.string().min(3, 'Please enter a website URL')),
  productDescription: z.string().min(10, 'Please provide at least 10 characters describing your product'),
  platform: z.enum(['meta', 'tiktok', 'youtube', 'reddit', 'linkedin', 'google'] as const),
  brandVoice: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AnalysisFormProps {
  onSubmit: (data: AnalysisInput) => void;
  isLoading: boolean;
  currentStep: string;
}

const platformLabels: Record<Platform, string> = {
  meta: 'Meta (Facebook/Instagram)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  reddit: 'Reddit',
  linkedin: 'LinkedIn',
  google: 'Google Search',
};

const stepMessages: Record<string, string> = {
  scraping: 'Fetching website content...',
  analyzing: 'Analyzing your product & market...',
  generating: 'Crafting your marketing strategy...',
};

export function AnalysisForm({ onSubmit, isLoading, currentStep }: AnalysisFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      websiteUrl: '',
      productDescription: '',
      platform: 'meta',
      brandVoice: '',
    },
  });

  const selectedPlatform = watch('platform');

  const handleFormSubmit = (data: FormData) => {
    let url = data.websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    onSubmit({
      websiteUrl: url,
      productDescription: data.productDescription,
      platform: data.platform,
      brandVoice: data.brandVoice,
    });
  };

  return (
    <Card className="shadow-warm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Start Your Analysis</CardTitle>
        <CardDescription>
          Enter your website and product details to receive tailored marketing insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL *</Label>
            <Input
              id="websiteUrl"
              placeholder="example.com"
              {...register('websiteUrl')}
              className="bg-background"
            />
            {errors.websiteUrl && (
              <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="productDescription">Product Description *</Label>
            <Textarea
              id="productDescription"
              placeholder="Describe what your product does and who it's for..."
              rows={3}
              {...register('productDescription')}
              className="bg-background resize-none"
            />
            {errors.productDescription && (
              <p className="text-sm text-destructive">{errors.productDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Primary Advertising Platform *</Label>
            <Select
              value={selectedPlatform}
              onValueChange={(value: Platform) => setValue('platform', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(platformLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandVoice">Brand Voice & Messaging Context (Optional)</Label>
            <Textarea
              id="brandVoice"
              placeholder="Describe your brand's tone, vocabulary preferences, or words to avoid..."
              rows={2}
              {...register('brandVoice')}
              className="bg-background resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-medium shadow-warm"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {stepMessages[currentStep] || 'Analyzing...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Analyze & Generate Strategy
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
