
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountDialogProps {
  userEmail: string;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ userEmail }) => {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmEmail !== userEmail) {
      toast({
        title: "Error",
        description: "Email confirmation doesn't match your account email",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Starting account deletion process...');

      // Call the delete-user edge function to delete the auth user
      const { data, error: deleteError } = await supabase.functions.invoke('delete-user');

      if (deleteError) {
        console.error('Error deleting user account:', deleteError);
        toast({
          title: "Error",
          description: "User not found or failed to delete account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Account deletion successful:', data);
      
      // Sign out the user (this may fail since user is already deleted, but that's expected)
      try {
        await signOut();
      } catch (signOutError) {
        // Expected error since user was already deleted - ignore it
        console.log('Expected sign out error after account deletion:', signOutError);
      }
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({
        title: "Error",
        description: "User not found or an unexpected error occurred while deleting your account.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove all your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="confirm-email">
              Type your email address to confirm deletion:
            </Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder={userEmail}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmEmail !== userEmail || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
