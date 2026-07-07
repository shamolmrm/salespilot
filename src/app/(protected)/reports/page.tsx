'use client';

import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useReportsOverview, useRevenueReport, useProductsReport } from '@/hooks/useReports';
import { BarChart2, TrendingUp, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

type Tab = 'overview' | 'revenue' | 'products';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: overview, isLoading: overviewLoading } = useReportsOverview();
  const { data: revenue, isLoading: revenueLoading } = useRevenueReport(year);
  const { data: products, isLoading: productsLoading } = useProductsReport();

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 size={22} />
        <h1 className="text-xl font-semibold">Reports</h1>
      </div>

      <div className="flex border rounded-lg overflow-hidden w-fit">
        {([['overview', 'Overview', BarChart2], ['revenue', 'Revenue', TrendingUp], ['products', 'Products', Package]] as [Tab, string, React.ComponentType<{ size?: number }>][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors ${tab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        overviewLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : overview ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Revenue" value={fmt(overview.totalRevenue)} />
              <StatCard label="Total Invoiced" value={fmt(overview.totalInvoiced)} />
              <StatCard label="Paid Invoices" value={overview.paidInvoices} />
              <StatCard label="Overdue" value={overview.overdueInvoices} />
              <StatCard label="Total Leads" value={overview.totalLeads} />
              <StatCard label="Converted" value={overview.convertedLeads} sub={overview.totalLeads > 0 ? `${Math.round(overview.convertedLeads / overview.totalLeads * 100)}% rate` : undefined} />
              <StatCard label="Quotations" value={overview.totalQuotations} />
              <StatCard label="Accepted" value={overview.acceptedQuotations} sub={overview.totalQuotations > 0 ? `${Math.round(overview.acceptedQuotations / overview.totalQuotations * 100)}% rate` : undefined} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-3">Invoices by Status</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Pie data={overview.invoicesByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={(entry: any) => `${entry.status}: ${entry.count}`}>
                      {overview.invoicesByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-3">Leads by Status</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={overview.leadsByStatus} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null
      )}

      {tab === 'revenue' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}><ChevronLeft size={14} /></Button>
            <span className="font-medium text-lg">{year}</span>
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}><ChevronRight size={14} /></Button>
            {revenue && <span className="text-sm text-muted-foreground ml-4">Total revenue: {fmt(revenue.totalRevenue)}</span>}
          </div>

          {revenueLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : revenue ? (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-3">Monthly Revenue</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenue.monthly} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-3">Invoiced vs Collected</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenue.invoiceMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
                    <Legend />
                    <Line type="monotone" dataKey="invoiced" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="collected" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tab === 'products' && (
        productsLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : products ? (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium mb-3">Top Products by Revenue</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={products.topProducts} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null
      )}
    </div>
  );
}
