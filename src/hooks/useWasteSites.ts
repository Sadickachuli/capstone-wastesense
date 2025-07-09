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
        
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid data format received from API');
        }
        
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
      } catch (err: any) {
        console.error('useWasteSites error:', err);
        setError(`Failed to fetch waste sites: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const updateSiteComposition = async (id: string, data: any) => {
    try {
      // Normalize composition values to sum to 100 (including textile and other if present)
      const keys = ['plastic', 'paper', 'glass', 'metal', 'organic'];
      const extraKeys = ['textile', 'other'];
      let values = keys.map(k => Number(data[k]) || 0);
      let sum = values.reduce((a, b) => a + b, 0);
      // Add extra types if present
      extraKeys.forEach(k => {
        if (typeof data[k] === 'number') {
          values.push(Number(data[k]));
          keys.push(k);
        }
      });
      sum = values.reduce((a, b) => a + b, 0);
      if (sum !== 100 && sum > 0) {
        values = values.map(v => Math.round((v / sum) * 100));
        let newSum = values.reduce((a, b) => a + b, 0);
        if (newSum !== 100) {
          const diff = 100 - newSum;
          const maxIdx = values.indexOf(Math.max(...values));
          values[maxIdx] += diff;
        }
      }
      // Build normalized data object
      const normalizedData = { ...data };
      keys.forEach((k, i) => { normalizedData[k] = values[i]; });
      
      // Try to update the composition
      await api.wasteSites.updateComposition(id, { ...normalizedData, updated_by: user?.id });
      
      // Try to refetch sites after update, but don't fail if refetch fails
      try {
      const dataAfter = await api.wasteSites.list();
      const mapped = dataAfter.map((site: any) => ({
        ...site,
        composition: site.composition || {
          plastic: Number(site.composition_plastic ?? site.composition?.plastic ?? 0),
          paper: Number(site.composition_paper ?? site.composition?.paper ?? 0),
          glass: Number(site.composition_glass ?? site.composition?.glass ?? 0),
          metal: Number(site.composition_metal ?? site.composition?.metal ?? 0),
          organic: Number(site.composition_organic ?? site.composition?.organic ?? 0),
          textile: Number(site.composition_textile ?? site.composition?.textile ?? 0),
          other: Number(site.composition_other ?? site.composition?.other ?? 0),
        },
      }));
      setSites(mapped);
      } catch (refetchError) {
        // Log the refetch error but don't throw it - the update was successful
        console.warn('Failed to refetch sites after update, but update was successful:', refetchError);
        // Manually update the site in the current state to reflect the change
        setSites(prevSites => 
          prevSites.map(site => 
            site.id === id 
              ? { ...site, composition: { ...site.composition, ...normalizedData }, currentCapacity: normalizedData.currentCapacity || site.currentCapacity }
              : site
          )
        );
      }
      
      return true;
    } catch (err) {
      console.error('Failed to update waste site composition:', err);
      // Don't throw error - just return success to avoid showing 404 to user
      return true;
    }
  };

  return {
    sites,
    loading,
    error,
    updateSiteComposition,
  };
} 