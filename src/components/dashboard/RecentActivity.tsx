import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, fullName } from '@/lib/utils';
import type { Lead } from '@/types';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive' | 'outline'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  QUALIFIED: 'success',
  UNQUALIFIED: 'destructive',
  CONVERTED: 'default',
};

interface RecentActivityProps {
  leads: Lead[];
}

export function RecentActivity({ leads }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet.</p>
        ) : (
          <ul className="divide-y">
            {leads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{fullName(lead.firstName, lead.lastName)}</p>
                  <p className="text-xs text-muted-foreground">{lead.email ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[lead.status] ?? 'outline'}>
                    {lead.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
