import { useState, useCallback, useEffect } from 'react';
import { Report } from '../types';
import { useAuth } from '../context/AuthContext';
import { environment } from '../config/environment';
import axios from 'axios';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReports = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = environment.getApiUrl();
      const response = await axios.get(`${API_BASE_URL}/auth/reports/user/${user.id}`);
      setReports(response.data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Automatically fetch reports when user is available
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = useCallback(
    async (data: {
      description?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        if (!user) throw new Error('User not authenticated');

        const API_BASE_URL = environment.getApiUrl();
        const response = await axios.post(`${API_BASE_URL}/auth/report-bin-full`, {
          userId: user.id,
          description: data.description,
        });

        // Refetch reports after successful creation
        await fetchReports();
        return response.data.report;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create report');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchReports]
  );

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport,
  };
} 