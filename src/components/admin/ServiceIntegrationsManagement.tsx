
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import ServiceIntegrationsTable from './ServiceIntegrationsTable';
import AddServiceIntegrationForm, { ServiceIntegrationFormValues } from './AddServiceIntegrationForm';
import { useServiceIntegrations } from '@/hooks/useServiceIntegrations';

const ServiceIntegrationsManagement = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { integrations, loading, addIntegration, updateIntegrationStatus } = useServiceIntegrations();

  // Create a wrapper function to handle the Promise returned by addIntegration
  const handleAddIntegration = async (integration: ServiceIntegrationFormValues) => {
    try {
      // Cast the integration object to the required type to fix the TypeScript error
      const result = await addIntegration(integration as any);
      if (!result.success && result.error) {
        throw result.error;
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service Integrations</h2>
          <p className="text-muted-foreground">
            Manage property monetization service partners and integrations
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Integration
        </Button>
      </div>

      <div className="glass-effect rounded-lg border p-1">
        <ServiceIntegrationsTable
          integrations={integrations}
          loading={loading}
          onUpdateStatus={updateIntegrationStatus}
        />
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Service Integration</DialogTitle>
          </DialogHeader>
          <AddServiceIntegrationForm 
            onAdd={handleAddIntegration}
            onClose={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceIntegrationsManagement;
