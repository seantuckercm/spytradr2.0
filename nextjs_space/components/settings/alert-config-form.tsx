
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateAlertConfigSchema, UpdateAlertConfigInput } from '@/lib/validators/alert';
import { updateAlertConfig, getAlertConfig } from '@/actions/alert-actions';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Bell, Mail, MessageSquare } from 'lucide-react';

export function AlertConfigForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const form = useForm<UpdateAlertConfigInput>({
    resolver: zodResolver(updateAlertConfigSchema),
    defaultValues: {
      emailEnabled: true,
      emailAddress: '',
      discordEnabled: false,
      discordWebhookUrl: '',
      minConfidenceThreshold: 70,
      alertOnBuySignals: true,
      alertOnSellSignals: true,
      maxAlertsPerHour: 10,
      quietHoursEnabled: false,
      quietHoursStart: '',
      quietHoursEnd: '',
    },
  });
  
  // Fetch existing config on mount
  useEffect(() => {
    async function fetchConfig() {
      setIsFetching(true);
      const result = await getAlertConfig();
      
      if (result.success && result.data) {
        form.reset({
          emailEnabled: result.data.emailEnabled,
          emailAddress: result.data.emailAddress || '',
          discordEnabled: result.data.discordEnabled,
          discordWebhookUrl: result.data.discordWebhookUrl || '',
          minConfidenceThreshold: result.data.minConfidenceThreshold,
          alertOnBuySignals: result.data.alertOnBuySignals,
          alertOnSellSignals: result.data.alertOnSellSignals,
          maxAlertsPerHour: result.data.maxAlertsPerHour,
          quietHoursEnabled: result.data.quietHoursEnabled,
          quietHoursStart: result.data.quietHoursStart || '',
          quietHoursEnd: result.data.quietHoursEnd || '',
        });
      }
      setIsFetching(false);
    }
    
    fetchConfig();
  }, [form]);
  
  const onSubmit = async (data: UpdateAlertConfigInput) => {
    setIsLoading(true);
    
    const result = await updateAlertConfig(data);
    
    setIsLoading(false);
    
    if (result.success) {
      toast({
        title: 'Alert settings updated',
        description: 'Your notification preferences have been saved successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };
  
  if (isFetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alert Configuration
        </CardTitle>
        <CardDescription>
          Configure when and how you receive trading signal notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailEnabled" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive trading signals via email
                </p>
              </div>
              <Switch
                id="emailEnabled"
                checked={form.watch('emailEnabled')}
                onCheckedChange={(checked) => form.setValue('emailEnabled', checked)}
                disabled={isLoading}
              />
            </div>
            
            {form.watch('emailEnabled') && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  {...form.register('emailAddress')}
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use your account email
                </p>
                {form.formState.errors.emailAddress && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.emailAddress.message}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Discord Webhooks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="discordEnabled" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Discord Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send signals to a Discord channel
                </p>
              </div>
              <Switch
                id="discordEnabled"
                checked={form.watch('discordEnabled')}
                onCheckedChange={(checked) => form.setValue('discordEnabled', checked)}
                disabled={isLoading}
              />
            </div>
            
            {form.watch('discordEnabled') && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="discordWebhookUrl">Discord Webhook URL</Label>
                <Input
                  id="discordWebhookUrl"
                  {...form.register('discordWebhookUrl')}
                  placeholder="https://discord.com/api/webhooks/..."
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Get your webhook URL from Discord Server Settings → Integrations
                </p>
                {form.formState.errors.discordWebhookUrl && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.discordWebhookUrl.message}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Alert Thresholds */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="minConfidenceThreshold">
                Minimum Confidence Threshold ({form.watch('minConfidenceThreshold')}%)
              </Label>
              <div className="pt-2">
                <Slider
                  id="minConfidenceThreshold"
                  min={0}
                  max={100}
                  step={5}
                  value={[form.watch('minConfidenceThreshold') || 70]}
                  onValueChange={([value]) => form.setValue('minConfidenceThreshold', value)}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Only receive alerts for signals with confidence at or above this level
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="alertOnBuySignals">Alert on BUY signals</Label>
              <Switch
                id="alertOnBuySignals"
                checked={form.watch('alertOnBuySignals')}
                onCheckedChange={(checked) => form.setValue('alertOnBuySignals', checked)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="alertOnSellSignals">Alert on SELL signals</Label>
              <Switch
                id="alertOnSellSignals"
                checked={form.watch('alertOnSellSignals')}
                onCheckedChange={(checked) => form.setValue('alertOnSellSignals', checked)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Frequency Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxAlertsPerHour">
                Max Alerts Per Hour ({form.watch('maxAlertsPerHour')})
              </Label>
              <Slider
                id="maxAlertsPerHour"
                min={1}
                max={50}
                step={1}
                value={[form.watch('maxAlertsPerHour') || 10]}
                onValueChange={([value]) => form.setValue('maxAlertsPerHour', value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Limit the number of notifications to prevent spam
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quietHoursEnabled">Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Mute notifications during specific hours
                </p>
              </div>
              <Switch
                id="quietHoursEnabled"
                checked={form.watch('quietHoursEnabled')}
                onCheckedChange={(checked) => form.setValue('quietHoursEnabled', checked)}
                disabled={isLoading}
              />
            </div>
            
            {form.watch('quietHoursEnabled') && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="quietHoursStart">Start Time</Label>
                  <Input
                    id="quietHoursStart"
                    type="time"
                    {...form.register('quietHoursStart')}
                    placeholder="22:00"
                    disabled={isLoading}
                  />
                  {form.formState.errors.quietHoursStart && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.quietHoursStart.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quietHoursEnd">End Time</Label>
                  <Input
                    id="quietHoursEnd"
                    type="time"
                    {...form.register('quietHoursEnd')}
                    placeholder="08:00"
                    disabled={isLoading}
                  />
                  {form.formState.errors.quietHoursEnd && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.quietHoursEnd.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Alert Settings'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
