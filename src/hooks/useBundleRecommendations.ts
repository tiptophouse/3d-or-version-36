
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BundleConfiguration, BundleRecommendation, ServiceProvider } from '@/contexts/ServiceProviders/types';

export const useBundleRecommendations = (selectedAssets: string[] = []) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<BundleRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAssets.length > 0) {
      fetchRecommendations();
    }
  }, [selectedAssets]);

  const fetchRecommendations = async () => {
    if (!user || selectedAssets.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch bundle configurations
      const { data: bundles, error: bundlesError } = await supabase
        .from('bundle_configurations')
        .select('*')
        .eq('is_active', true);

      if (bundlesError) throw bundlesError;

      // Fetch service providers
      const { data: providers, error: providersError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('is_active', true);

      if (providersError) throw providersError;

      // Filter bundles that match selected assets and convert types
      const matchingBundles: BundleRecommendation[] = (bundles || [])
        .map(bundle => {
          // Convert Json type to string array
          const assetRequirements = Array.isArray(bundle.asset_requirements) 
            ? bundle.asset_requirements as string[]
            : typeof bundle.asset_requirements === 'string'
            ? JSON.parse(bundle.asset_requirements)
            : [];

          const bundleConfig: BundleConfiguration = {
            ...bundle,
            asset_requirements: assetRequirements
          };

          const matchingAssets = bundleConfig.asset_requirements.filter(asset => 
            selectedAssets.includes(asset)
          );

          // Only include if bundle requirements are met
          if (matchingAssets.length >= bundleConfig.min_assets) {
            // Get relevant providers for this bundle
            const bundleProviders = (providers || []).filter(provider =>
              bundleConfig.asset_requirements.some(asset => 
                provider.category === asset
              )
            );

            return {
              bundle: bundleConfig,
              providers: bundleProviders,
              totalEarnings: {
                low: bundleConfig.total_monthly_earnings_low,
                high: bundleConfig.total_monthly_earnings_high
              },
              matchingAssets,
              setupCost: bundleConfig.total_setup_cost
            };
          }
          return null;
        })
        .filter(Boolean) as BundleRecommendation[];

      // Sort by potential earnings
      matchingBundles.sort((a, b) => b.totalEarnings.high - a.totalEarnings.high);

      setRecommendations(matchingBundles);
    } catch (err) {
      console.error('Error fetching bundle recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const selectBundle = async (bundleId: string, propertyAddress: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_bundle_selections')
        .insert({
          user_id: user.id,
          bundle_id: bundleId,
          property_address: propertyAddress,
          selected_assets: selectedAssets,
          selected_providers: [],
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error selecting bundle:', err);
      throw err;
    }
  };

  return {
    recommendations,
    isLoading,
    error,
    selectBundle,
    refetch: fetchRecommendations
  };
};
