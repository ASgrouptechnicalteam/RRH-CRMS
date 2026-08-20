import React, { useState } from 'react';
import { Card, type CardHeaderProps, type CardTitleProps, type CardDescriptionProps, type CardContentProps, type CardFooterProps } from '../common/ui/Card';
import { InputField } from '../common/ui/InputField';
import { SelectField } from '../common/ui/SelectField';
import { Button } from '../common/ui/Button';
import { StatusChip } from '../common/ui/StatusChip';
import { Skeleton } from '../common/ui/Skeleton';
import { AppLayout } from '../common/AppLayout';

/**
 * LeadsClientsPage — Primary Leads & Clients view.
 *
 * Layout:
   - AppLayout shell (compact left sidebar, top utility bar, 12-col content grid)
   - Page header with H1 typography and "+ New Lead" primary action button
   - Filter row with InputField (search) and two SelectField components (status, budget)
   - Data grid of lead cards with columns: Lead Info, Requirement, Status, Next Action, Actions
   - Loading state with Skeleton primitives
   - 3 dummy lead entries populated with realistic Sonthillu CRM data
 *
 * Visual design:
   - App Background `--color-canvas: #f4fafc` applied via AppLayout
   - 8px spacing rhythm: gap-4, p-6, etc.
   - Navy text via `text-navy` / `text-neutral-900` CSS variables
   - Action Blue interactive states via `var(--color-action-blue)`
   - Status chips using StatusChip primitive with semantic colors
   - Cards using Card primitive with 16px radius, subtle borders, soft shadows
 */

type LeadStatus = 'NEW' | 'SITE_VISIT' | 'NEGOTIATION' | 'CLOSED';

interface Lead {
  id: number;
  name: string;
  phone: string;
  budget: string;
  locality: string;
  status: LeadStatus;
  nextFollowUp: string; // e.g., "Tomorrow 2 PM"
}

/** Dummy data for exactly 3 leads */
const DUMMY_LEADS: Lead[] = [
  {
    id: 1,
    name: 'Arjun Patel',
    phone: '+91 98480 12345',
    budget: '75L - 1Cr',
    locality: 'Miyapur',
    status: 'NEW',
    nextFollowUp: 'Tomorrow 2 PM',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    phone: '+91 97001 67890',
    budget: '1Cr - 2Cr',
    locality: 'Banjara Hills',
    status: 'SITE_VISIT',
    nextFollowUp: 'In 2 days 10 AM',
  },
  {
    id: 3,
    name: 'Rahul Singh',
    phone: '+91 96662 55555',
    budget: 'Under 50L',
    locality: 'Kukatpally',
    status: 'NEGOTIATION',
    nextFollowUp: 'Friday 4 PM',
  },
];

/** Format status chip variant from LeadStatus */
const statusVariantMap: Record<LeadStatus, StatusChipVariant> = {
  NEW: 'available',
  SITE_VISIT: 'reserved',
  NEGOTIATION: 'pending_approval',
  CLOSED: 'sold',
};

/** LeadsClientsPage component */
const LeadsClientsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'NEW' | 'SITE_VISIT' | 'NEGOTIATION' | 'CLOSED'>('All');
  const [budgetFilter, setBudgetFilter] = useState<'All' | 'Under 50L' | '50L-1Cr' | '1Cr+'>('All');

  // Filtered leads computation
  const filteredLeads = DUMMY_LEADS.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || lead.status === statusFilter;
    const matchesBudget =
      budgetFilter === 'All' ||
      (budgetFilter === 'Under 50L' && lead.budget === 'Under 50L') ||
      (budgetFilter === '50L-1Cr' && lead.budget === '75L - 1Cr') ||
      (budgetFilter === '1Cr+' && lead.budget === '1Cr - 2Cr');

    return matchesSearch && matchesStatus && matchesBudget;
  });

  return (
    <AppLayout title="Leads & Clients">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Leads & Clients
        </h1>
        <Button
          variant="primary"
          size="md"
          style={{ float: 'right', marginTop: '-4px' }}
          onClick={() => alert('New Lead flow triggered')}
        >
          + New Lead
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="mb-8 rounded-none border border-neutral-200" style={{
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--color-surface-soft)',
      }}>
        <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InputField
            placeholder="Search by name or phone..."
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
          <SelectField
            label="Status"
            value={statusFilter as string}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'NEW' | 'SITE_VISIT' | 'NEGOTIATION' | 'CLOSED')}
            options={[
              { value: 'All', label: 'All' },
              { value: 'NEW', label: 'New' },
              { value: 'SITE_VISIT', label: 'Site Visit' },
              { value: 'NEGOTIATION', label: 'Negotiation' },
              { value: 'CLOSED', label: 'Closed' },
            ]}
          />
          <SelectField
            label="Budget"
            value={budgetFilter as string}
            onChange={(e) => setBudgetFilter(e.target.value as 'All' | 'Under 50L' | '50L-1Cr' | '1Cr+')}
            options={[
              { value: 'All', label: 'All' },
              { value: 'Under 50L', label: 'Under 50L' },
              { value: '50L-1Cr', label: '50L - 1Cr' },
              { value: '1Cr+', label: '1Cr+' },
            ]}
          />
        </div>
      </Card>

      {/* Data Grid */}
      {isLoading ? (
        /* Loading state: three skeleton rows matching lead card height */
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              shape="card"
              className="rounded-md border border-neutral-200 p-4"
              style={{ height: 'auto' }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="rounded-md border border-neutral-200 overflow-hidden"
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <div className="p-4">
                {/* Lead Info: Name and Phone (stacked) */}
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-neutral-900">
                    {lead.name}
                  </div>
                  <div className="text-neutral-500">
                    {lead.phone}
                  </div>
                </div>

                {/* Requirement: Budget & Preferred Locality */}
                <p className="text-xs text-neutral-500 mb-2">
                  {lead.budget} • {lead.locality}
                </p>

                {/* Status: StatusChip */}
                <StatusChip variant={statusVariantMap[lead.status as keyof typeof statusVariantMap]} />

                {/* Next Action: Next follow-up date and time */}
                <p className="text-xs text-neutral-500 mt-2">
                  Next: {lead.nextFollowUp}
                </p>

                {/* Actions: Ghost Button for "Edit" or "View" */}
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => alert(`View lead ${lead.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => alert(`Edit lead ${lead.id}`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export { LeadsClientsPage };