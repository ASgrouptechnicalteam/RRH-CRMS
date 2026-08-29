import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
  SalesOpportunity,
  PipelineMetricsData,
  ConversionMetricsData,
} from '../types';

export function useSalesPipeline() {
  const { fetchWithAuth } = useAuth();
  
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetricsData | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async (filters: Record<string, string | number> = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') queryParams.append(key, String(value));
      });

      const res = await fetchWithAuth(`${API_BASE_URL}/opportunities?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch sales opportunities');

      setOpportunities(data.opportunities || []);
      setTotalOpportunities(data.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const fetchPipelineMetrics = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/opportunities/pipeline-metrics`);
      const data = await res.json();
      if (res.ok) {
        setPipelineMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error fetching pipeline metrics', err);
    }
  }, [fetchWithAuth]);

  const fetchConversionMetrics = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/opportunities/conversion-metrics`);
      const data = await res.json();
      if (res.ok) {
        setConversionMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error fetching conversion metrics', err);
    }
  }, [fetchWithAuth]);

  const updateSalesStage = async (id: number, newStage: string, dropReason?: string) => {
    const opp = opportunities.find(o => o.id === id);
    if (!opp || !opp.lead_id) {
      throw new Error('Associated lead not found for this opportunity');
    }

    const payload: { status: string; exit_reason?: string } = { status: newStage };
    if (dropReason) payload.exit_reason = dropReason;

    const res = await fetchWithAuth(`${API_BASE_URL}/leads/${opp.lead_id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update sales stage');
    }
    
    return data.lead;
  };

  const getSalesOpportunityDetails = async (id: number) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/opportunities/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch sales details');
    return data.opportunity;
  };

  return {
    opportunities,
    totalOpportunities,
    pipelineMetrics,
    conversionMetrics,
    isLoading,
    error,
    fetchOpportunities,
    fetchPipelineMetrics,
    fetchConversionMetrics,
    updateSalesStage,
    getSalesOpportunityDetails
  };
}
