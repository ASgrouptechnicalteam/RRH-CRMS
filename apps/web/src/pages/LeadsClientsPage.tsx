import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, type CardHeaderProps, type CardTitleProps, type CardDescriptionProps, type CardContentProps, type CardFooterProps } from '../components/common/ui/Card';
import { InputField } from '../components/common/ui/InputField';
import { SelectField } from '../components/common/ui/SelectField';
import { Button } from '../components/common/ui/Button';
import { StatusChip, type StatusChipVariant } from '../components/common/ui/StatusChip';
import { Skeleton } from '../components/common/ui/Skeleton';
import { EmptyState } from '../components/common/ui/EmptyState';
import { AppLayout } from '../components/common/AppLayout';

/**
 * Lead status filter types matching the backend API.
 */
type LeadStatus = 'NEW' | 'SITE_VISIT' | 'NEGOTIATION' | 'CLOSED';

/** Budget filter options matching the backend API. */
type BudgetFilter = 'Under 50L' | '50L-1Cr' | '1Cr+';

/** Individual lead data shape from the backend. */
interface Lead {
  id: number;
  name: string;
  phone: string;
  budget: string;
  locality: string;
  status: LeadStatus;
  nextFollowUp: string;
}

/**
 * LeadsClientsPage — Live backend-integrated Leads & Clients view.
 *
 * Data fetching strategy (discovered in codebase):
 *   - Uses `useAuth()` → `fetchWithAuth()` from `context/AuthContext`
 *   - `API_BASE_URL` from `config.ts`: `http://localhost:3000/api/v1`
 *   - Pattern: `fetchWithAuth(\`${API_BASE_URL}/leads?search=X&status=Y&budget=Z\`)`
 *   - No new libraries installed — strictly useEffect + fetch pattern
 *
 * Visual design:
 *   - App Background `--color-canvas: #f4fafc` via AppLayout
 *   - 8px spacing rhythm: gap-4, p-6, etc.
 *   - Navy text via `text-neutral-900` CSS variables
 *   - Action Blue interactive states via `var(--color-action-blue)`
 *   - Status chips using StatusChip primitive with semantic colors
 *   - Cards using Card primitive with 16px radius, subtle borders, soft shadows
 */

const LeadsClientsPage: React.FC = () => {
  /** Auth context — provides fetchWithAuth and accessToken */
  const { user, fetchWithAuth, accessToken } = useAuth();

  /** Filter state */
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [budgetFilter, setBudgetFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  /** Backend API endpoint */
  const API_ENDPOINT = '/leads';

  /** Build query parameters from filter state */
  const buildQueryParams = (): string => {
    const params: string[] = [];
    if (searchQuery && searchQuery.trim()) {
      params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (statusFilter && statusFilter !== 'All') {
      params.push(`status=${encodeURIComponent(statusFilter)}`);
    }
    if (budgetFilter && budgetFilter !== 'All') {
      params.push(`budget=${encodeURIComponent(budgetFilter)}`);
    }
    return params.join('&');
  };

  /** Fetch leads from the backend with current filter state */
  const fetchLeads = async (): Promise<void> => {
    if (!accessToken) {
      setLeads([]);
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const query = buildQueryParams();
      const url = query ? `${API_ENDPOINT}?${query}` : API_ENDPOINT;
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch leads');
      }
      const data = (await res.json()) as Lead[];
      setLeads(data);
    } catch (err: any) {
      console.error('[LeadsClientsPage] fetch error:', err);
      setApiError(err.message || 'Unexpected error loading leads');
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  /** Fetch leads when component mounts or when filter state changes */
  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter, budgetFilter, accessToken]);

  /** Render the data grid */
  const renderGrid = (): JSX.Element => {
    if (isLoading) {
      /** Loading state: skeleton cards matching lead card dimensions */
      return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: Math.max(leads.length, 3) }).map((_, i) => (
            <Skeleton
              key={i}
              shape="card"
              className="rounded-md border border-neutral-200 p-4"
              style={{ height: 'auto' }}
            />
          ))}
        </div>
      );
    }

    if (apiError) {
      /** Error state: empty state with error message */
      return (
        <EmptyState
          title="Error Loading Leads"
          description={apiError}
          skeletonRows={1}
        >
          <Button variant="secondary" size="md" onClick={fetchLeads}>
            Retry
          </Button>
        </EmptyState>
      );
    }

    if (leads.length === 0) {
      /** Empty state: no leads match the current criteria */
      return (
        <EmptyState
          title="No leads match your criteria"
          description="Try adjusting your search or filter options."
          skeletonRows={1}
        />
      );
    }

    /** Render lead cards */
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {leads.map((lead) => (
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
              <StatusChip
                variant={{
                  NEW: 'available',
                  SITE_VISIT: 'reserved',
                  NEGOTIATION: 'pending_approval',
                  CLOSED: 'sold',
                }[lead.status as keyof Record<LeadStatus, StatusChipVariant>] as StatusChipVariant}
              />

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
    );
  };

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
      {renderGrid()}
    </AppLayout>
  );
};

export { LeadsClientsPage };