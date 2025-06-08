import { useState, useEffect } from 'react';
import { WasteSite } from '../types';
import { api } from '../api/mockApi';
import { useAuth } from '../context/AuthContext';

export function useWasteSites() {
  const [sites, setSites] = useState<WasteSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await api.wasteSites.list();
        const mapped = data.map((site: any) => ({
          ...site,
          composition: site.composition || {
            plastic: Number(site.composition_plastic ?? site.composition?.plastic ?? 0),
            paper: Number(site.composition_paper ?? site.composition?.paper ?? 0),
            glass: Number(site.composition_glass ?? site.composition?.glass ?? 0),
            metal: Number(site.composition_metal ?? site.composition?.metal ?? 0),
            organic: Number(site.composition_organic ?? site.composition?.organic ?? 0),
          },
        }));
        setSites(mapped);
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

  const updateSiteComposition = async (id: string, data: any) => {
    try {
      // Normalize composition values to sum to 100
      const keys = ['plastic', 'paper', 'glass', 'metal', 'organic'];
      let values = keys.map(k => Number(data[k]) || 0);
      let sum = values.reduce((a, b) => a + b, 0);
      // Scale if sum is not 100
      if (sum !== 100 && sum > 0) {
        values = values.map(v => Math.round((v / sum) * 100));
        let newSum = values.reduce((a, b) => a + b, 0);
        // If rounding caused sum to be off, adjust the largest value
        if (newSum !== 100) {
          const diff = 100 - newSum;
          const maxIdx = values.indexOf(Math.max(...values));
          values[maxIdx] += diff;
        }
      }
      // Build normalized data object
      const normalizedData = { ...data };
      keys.forEach((k, i) => { normalizedData[k] = values[i]; });
      await api.wasteSites.updateComposition(id, { ...normalizedData, updated_by: user?.id });
      return true;
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