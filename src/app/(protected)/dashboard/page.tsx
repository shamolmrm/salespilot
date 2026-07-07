'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Handshake, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api-client';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { accessToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<DashboardStats>('/api/dashboard', accessToken!),
    enabled: !!accessToken,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Leads"
          value={data.totalLeads}
          sub={`+${data.newLeadsThisMonth} this month`}
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Customers"
          value={data.totalCustomers}
          icon={UserCheck}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Open Deals"
          value={data.totalDeals}
          icon={Handshake}
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Pipeline Value"
          value={formatCurrency(data.openDealValue)}
          icon={TrendingUp}
          iconColor="text-orange-500"
        />
      </div>

      <RecentActivity leads={data.recentLeads} />
    </div>
  );
}
