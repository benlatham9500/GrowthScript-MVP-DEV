
import React, { useState } from 'react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/Footer';
import AddClientDialog from '@/components/AddClientDialog';
import EditClientDialog from '@/components/EditClientDialog';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardStats from '@/components/DashboardStats';
import ClientTable from '@/components/ClientTable';
import { useClients, Client } from '@/hooks/useClients';

const Dashboard = () => {
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const { subscription, loading } = useUserSubscription();
  const { toast } = useToast();
  const {
    clients,
    isLoading: clientsLoading,
    deleteClient,
    isDeletingClient,
    refreshClients,
    canAddClient
  } = useClients();
  
  const handleCreateNew = () => {
    if (!canAddClient()) {
      toast({
        title: "Client Limit Reached",
        description: `You have reached your plan's limit of ${subscription?.client_limit || 0} clients. Please upgrade your plan to add more clients.`,
        variant: "destructive"
      });
      return;
    }
    setShowAddClientDialog(true);
  };
  
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowEditClientDialog(true);
  };
  
  const handleArchive = (clientId: string) => {
    deleteClient(clientId);
  };
  
  if (loading || clientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      <div className="container py-8 flex-1">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clients and grow your agency with AI-powered strategies.
            </p>
          </div>

          <DashboardStats subscription={subscription} clientsCount={clients.length} />

          <ClientTable
            clients={clients}
            isDeletingClient={isDeletingClient}
            canAddClient={canAddClient}
            subscription={subscription}
            onAddClient={handleCreateNew}
            onEditClient={handleEdit}
            onDeleteClient={handleArchive}
          />
        </div>
      </div>

      <AddClientDialog 
        open={showAddClientDialog} 
        onOpenChange={setShowAddClientDialog} 
        onClientAdded={refreshClients} 
      />

      <EditClientDialog 
        open={showEditClientDialog} 
        onOpenChange={setShowEditClientDialog} 
        client={editingClient} 
        onClientUpdated={refreshClients} 
      />

      <Footer />
    </div>
  );
};

export default Dashboard;
