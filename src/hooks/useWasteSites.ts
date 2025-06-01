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
      await api.wasteSites.updateComposition(id, { ...data, updated_by: user?.id });
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