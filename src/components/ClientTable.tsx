
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/hooks/useClients';
import { Plus, MessageCircle, Edit, Trash2 } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  isDeletingClient: boolean;
  canAddClient: () => boolean;
  subscription: any;
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

const ClientTable = ({ 
  clients, 
  isDeletingClient, 
  canAddClient, 
  subscription, 
  onAddClient, 
  onEditClient, 
  onDeleteClient 
}: ClientTableProps) => {
  const navigate = useNavigate();

  const handleTalkToGrowthScript = (clientId: string, clientName: string) => {
    navigate(`/chat/${clientId}`);
  };

  return (
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
                    <Button variant="outline" size="sm" onClick={() => onEditClient(client)}>
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
                          <AlertDialogAction onClick={() => onDeleteClient(client.id)}>
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
                  onClick={onAddClient} 
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
  );
};

export default ClientTable;
