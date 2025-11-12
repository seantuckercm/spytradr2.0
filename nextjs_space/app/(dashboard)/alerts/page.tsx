
import { PageHeader } from '@/components/shared/page-header';
import { getAlertHistory } from '@/actions/alert-actions';
import { AlertHistoryTable } from '@/components/alerts/alert-history-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AlertHistoryPage() {
  const result = await getAlertHistory(50);
  const history = result.success && result.data ? result.data : [];

  // Calculate stats
  const totalAlerts = history.length;
  const sentAlerts = history.filter((h) => h.status === 'sent').length;
  const failedAlerts = history.filter((h) => h.status === 'failed').length;
  const emailAlerts = history.filter((h) => h.alertType === 'email').length;
  const discordAlerts = history.filter((h) => h.alertType === 'discord').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert History"
        description="View all notifications sent by the system"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Bell className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sentAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discord</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discordAlerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>
            A log of all notifications sent to your configured channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertHistoryTable history={history} />
        </CardContent>
      </Card>
    </div>
  );
}
