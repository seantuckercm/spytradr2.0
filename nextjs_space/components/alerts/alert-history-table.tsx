
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MessageSquare, TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';
import type { SelectAlertHistory } from '@/db/schema/alerts-schema';
import { Button } from '@/components/ui/button';

interface AlertHistoryTableProps {
  history: SelectAlertHistory[];
}

export function AlertHistoryTable({ history }: AlertHistoryTableProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedHistory = showAll ? history : history.slice(0, 20);

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No alerts sent yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Alerts will appear here when trading signals are generated
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Pair</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedHistory.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  {alert.status === 'sent' ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Sent
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="font-medium">{alert.krakenPair}</TableCell>

                <TableCell>
                  <Badge
                    variant={alert.direction === 'buy' ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {alert.direction === 'buy' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {alert.direction.toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      alert.confidence >= 75
                        ? 'default'
                        : alert.confidence >= 50
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {alert.confidence}%
                  </Badge>
                </TableCell>

                <TableCell>
                  {alert.entryPrice ? `$${parseFloat(alert.entryPrice).toFixed(2)}` : 'N/A'}
                </TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    {alert.alertType === 'email' && (
                      <Badge variant="outline" className="gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </Badge>
                    )}
                    {alert.alertType === 'discord' && (
                      <Badge variant="outline" className="gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Discord
                      </Badge>
                    )}
                    {alert.alertType === 'system' && (
                      <span className="text-muted-foreground text-sm">System</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(alert.sentAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {history.length > 20 && !showAll && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setShowAll(true)}>
            Show All ({history.length} total)
          </Button>
        </div>
      )}
    </div>
  );
}
