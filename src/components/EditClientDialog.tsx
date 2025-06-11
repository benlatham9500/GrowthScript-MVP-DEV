
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, useClients } from '@/hooks/useClients';

const formSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  industry: z.string().optional(),
  audience: z.string().optional(),
  product_types: z.string().optional(),
  brand_tone_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onClientUpdated: () => void;
}

const EditClientDialog = ({ open, onOpenChange, client, onClientUpdated }: EditClientDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isClientNameTaken } = useClients();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: '',
      industry: '',
      audience: '',
      product_types: '',
      brand_tone_notes: '',
    },
  });

  // Update form values when client changes
  useEffect(() => {
    if (client) {
      form.reset({
        client_name: client.client_name,
        industry: client.industry || '',
        audience: client.audience || '',
        product_types: client.product_types || '',
        brand_tone_notes: client.brand_tone_notes ? 
          typeof client.brand_tone_notes === 'string' 
            ? client.brand_tone_notes 
            : JSON.stringify(client.brand_tone_notes, null, 2)
          : '',
      });
    }
  }, [client, form]);

  const onSubmit = async (data: FormData) => {
    if (!user || !client) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a client",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate client name (excluding current client)
    if (data.client_name !== client.client_name && isClientNameTaken(data.client_name)) {
      toast({
        title: "Duplicate Client Name",
        description: "A client with this name already exists. Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse brand tone notes as JSON if provided
      let brandToneNotesJson = null;
      if (data.brand_tone_notes?.trim()) {
        try {
          brandToneNotesJson = JSON.parse(data.brand_tone_notes);
        } catch {
          // If it's not valid JSON, store as a simple object with the text
          brandToneNotesJson = { notes: data.brand_tone_notes };
        }
      }

      // Update client in database
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          client_name: data.client_name,
          industry: data.industry || null,
          audience: data.audience || null,
          product_types: data.product_types || null,
          brand_tone_notes: brandToneNotesJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (clientError) {
        console.error('Error updating client:', clientError);
        toast({
          title: "Error",
          description: "Failed to update client. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update embedding if client info changed
      const embeddingContent = `Client: ${data.client_name}
Industry: ${data.industry || 'Not specified'}
Audience: ${data.audience || 'Not specified'}
Product Types: ${data.product_types || 'Not specified'}
Brand Tone/Notes: ${data.brand_tone_notes || 'Not specified'}`;

      // Generate new embedding using edge function
      const { error: embeddingError } = await supabase.functions.invoke('generate-client-embedding', {
        body: {
          client_id: client.id,
          content: embeddingContent,
        },
      });

      if (embeddingError) {
        console.error('Error updating embedding:', embeddingError);
        // Don't fail the whole operation if embedding fails
        toast({
          title: "Warning",
          description: "Client updated but embedding generation failed. This may affect AI context.",
          variant: "destructive",
        });
      }

      toast({
        title: "Success",
        description: `Client "${data.client_name}" has been updated successfully!`,
      });

      onOpenChange(false);
      onClientUpdated();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client profile information. This information will be used to provide personalized AI strategies.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SaaS, E-commerce, Healthcare" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., B2B professionals, young adults, enterprise clients" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Types</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Software, Physical products, Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand_tone_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Tone / Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the brand personality, voice, values, or any specific notes for the AI agent. You can use JSON format for structured data."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
