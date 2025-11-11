
// components/settings/settings-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { updatePreferencesSchema } from '@/lib/validators/profile';
import { updatePreferences } from '@/actions/profile-actions';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { TIMEFRAMES } from '@/lib/constants/timeframes';
import { SelectProfile } from '@/db/schema/profiles-schema';

type FormData = z.infer<typeof updatePreferencesSchema>;

interface SettingsFormProps {
  profile: SelectProfile;
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues: {
      timezone: profile.preferences?.timezone || 'UTC',
      emailNotifications: profile.preferences?.emailNotifications ?? true,
      theme: profile.preferences?.theme || 'dark',
      defaultTimeframe: profile.preferences?.defaultTimeframe || '1h',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    const result = await updatePreferences(data);
    
    setIsLoading(false);
    
    if (result.success) {
      toast({
        title: 'Settings updated',
        description: 'Your preferences have been saved successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your account information managed by Clerk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{profile.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
              <p className="text-sm font-mono text-xs">{profile.userId.slice(0, 16)}...</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
              <Badge variant="secondary" className="capitalize">
                {profile.membership}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge 
                variant={profile.status === 'active' ? 'default' : 'destructive'}
                className="capitalize"
              >
                {profile.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your trading experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={form.watch('theme')}
                  onValueChange={(value: 'light' | 'dark' | 'system') => 
                    form.setValue('theme', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTimeframe">Default Timeframe</Label>
                <Select
                  value={form.watch('defaultTimeframe')}
                  onValueChange={(value) => form.setValue('defaultTimeframe', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  {...form.register('timezone')}
                  placeholder="UTC"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your timezone (e.g., America/New_York, Europe/London, UTC)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts for trading signals
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={form.watch('emailNotifications')}
                  onCheckedChange={(checked) => form.setValue('emailNotifications', checked)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            Your current usage and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usage Credits</span>
              <span className="text-sm text-muted-foreground">
                {profile.usedCredits || 0} / {profile.usageCredits || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Last Login</span>
              <span className="text-sm text-muted-foreground">
                {profile.lastLoginAt 
                  ? new Date(profile.lastLoginAt).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Account Created</span>
              <span className="text-sm text-muted-foreground">
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
