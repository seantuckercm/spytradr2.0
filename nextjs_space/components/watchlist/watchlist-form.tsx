
// components/watchlist/watchlist-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createWatchlistSchema } from '@/lib/validators/watchlist';
import { createWatchlist } from '@/actions/watchlist-actions';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

type WatchlistFormData = z.infer<typeof createWatchlistSchema>;

interface WatchlistFormProps {
  mode?: 'create' | 'edit';
  defaultValues?: Partial<WatchlistFormData>;
  onSuccess?: () => void;
}

export function WatchlistForm({ mode = 'create', defaultValues, onSuccess }: WatchlistFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showTip } = useTeacherMode();
  
  const form = useForm({
    resolver: zodResolver(createWatchlistSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      defaultConfidenceThreshold: defaultValues?.defaultConfidenceThreshold ?? 60,
    },
  });
  
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    const result = await createWatchlist(data);
    
    setIsLoading(false);
    
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Watchlist created successfully',
      });
      
      // Show teacher tip for first watchlist creation
      if (mode === 'create') {
        showTip('first_watchlist_created');
      }
      
      form.reset();
      onSuccess?.();
      router.push('/watchlists');
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Watchlist' : 'Edit Watchlist'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Create a new watchlist to organize your cryptocurrency trading pairs.'
            : 'Update your watchlist settings.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="My Crypto Watchlist"
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Brief description of this watchlist..."
              rows={3}
              disabled={isLoading}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          
          <div className="space-y-4">
            <Label>
              Default Confidence Threshold: {form.watch('defaultConfidenceThreshold')}%
            </Label>
            <Slider
              value={[form.watch('defaultConfidenceThreshold') || 60]}
              onValueChange={(value) => form.setValue('defaultConfidenceThreshold', value[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Minimum confidence level required for signals from this watchlist. 
              Individual items can override this setting.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Watchlist' : 'Update Watchlist'
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
