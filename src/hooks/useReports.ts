import { useState, useCallback } from 'react';
import { Report } from '../types';
import { api } from '../api/mockApi';
import { useAuth } from '../context/AuthContext';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.reports.list(user?.id);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createReport = useCallback(
    async (data: {
      zone: string;
      description?: string;
      location: { lat: number; lng: number };
    }) => {
      try {
        setLoading(true);
        setError(null);
        if (!user) throw new Error('User not authenticated');

        const newReport = await api.reports.create({
          userId: user.id,
          zone: data.zone,
          description: data.description,
          location: data.location,
        });

        setReports((prev) => [newReport, ...prev]);
        return newReport;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create report');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport,
  };
} 