import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/Footer';
import AddClientDialog from '@/components/AddClientDialog';
import EditClientDialog from '@/components/EditClientDialog';
import { useClients, Client } from '@/hooks/useClients';
import { ChevronDown, User, Settings, LogOut, Plus, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Dashboard = () => {
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { subscription, loading } = useUserSubscription();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clients, isLoading: clientsLoading, deleteClient, isDeletingClient, refreshClients, canAddClient } = useClients();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account"
        });
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while signing out.",
        variant: "destructive"
      });
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings page coming soon!"
    });
  };
  const handleCreateNew = () => {
    if (!canAddClient()) {
      toast({
        title: "Client Limit Reached",
        description: `You have reached your plan's limit of ${subscription?.client_limit || 0} clients. Please upgrade your plan to add more clients.`,
        variant: "destructive",
      });
      return;
    }
    setShowAddClientDialog(true);
  };
  const handleTalkToGrowthScript = (clientId: string, clientName: string) => {
    navigate(`/chat/${clientId}`);
  };
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowEditClientDialog(true);
  };
  const handleArchive = (clientId: string, clientName: string) => {
    deleteClient(clientId);
  };

  if (loading || clientsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>;
  }
  return <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent">GrowthScript</div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container py-8 flex-1">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clients and grow your agency with AI-powered strategies.
            </p>
          </div>

          {/* Reduced height stats section */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="py-2">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                  <p className="text-lg font-semibold capitalize">{subscription?.plan?.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {subscription?.client_limit} client{subscription?.client_limit !== 1 ? 's' : ''} allowed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="py-2">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                  <p className="text-lg font-semibold">{clients.length}</p>
                  <p className="text-xs text-muted-foreground">
                    of {subscription?.client_limit} clients
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="py-2">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">AI Strategies</p>
                  <p className="text-lg font-semibold">0</p>
                  <p className="text-xs text-muted-foreground">
                    Strategies created
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client List Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Client List</CardTitle>
              <CardDescription>Manage your clients and conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.client_name}</TableCell>
                      <TableCell className="text-muted-foreground">{client.industry || 'Not specified'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(client.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleTalkToGrowthScript(client.id, client.client_name)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Talk to GrowthScript
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={isDeletingClient}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{client.client_name}" and all associated data including embeddings. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleArchive(client.id, client.client_name)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">
                      <Button 
                        variant="ghost" 
                        className={`h-auto p-0 font-normal text-left justify-start ${!canAddClient() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleCreateNew}
                        disabled={!canAddClient()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {canAddClient() ? 'Add New Client' : `Client Limit Reached (${subscription?.client_limit || 0})`}
                      </Button>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
    </div>;
};

export default Dashboard;
