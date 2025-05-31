import { useState, useEffect } from 'react';
import { WasteSite } from '../types';
import { api } from '../api/mockApi';

export function useWasteSites() {
  const [sites, setSites] = useState<WasteSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await api.wasteSites.list();
        setSites(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch waste sites');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const updateSiteComposition = async (id: string, composition: WasteSite['composition']) => {
    try {
      const updatedSite = await api.wasteSites.updateComposition(id, composition);
      setSites(sites.map(site => site.id === id ? updatedSite : site));
      return updatedSite;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    sites,
    loading,
    error,
    updateSiteComposition,
  };
} 