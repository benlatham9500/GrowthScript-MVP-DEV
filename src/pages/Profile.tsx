
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User, CreditCard, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { subscription, loading: subLoading, refetch } = useUserSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match or are empty",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully",
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Customer portal error:', error);
        toast({
          title: "Error",
          description: "Failed to open subscription management. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else if (data?.redirect_url) {
        // Fallback to billing page if portal is not configured
        navigate('/billing');
        toast({
          title: "Info",
          description: data.message || "Redirecting to billing page",
        });
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleChangePlan = () => {
    console.log('Navigating to billing page...');
    try {
      navigate('/billing');
      toast({
        title: "Redirecting",
        description: "Taking you to the billing page...",
      });
    } catch (err) {
      console.error('Navigation error:', err);
      toast({
        title: "Error",
        description: "Failed to navigate to billing page",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const hasActiveSubscription = subscription && subscription.plan !== 'none' && subscription.client_limit > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')} 
              className="rounded-sm text-slate-100 bg-slate-700 hover:bg-slate-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>
                  View and manage your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user.email || ''} 
                    disabled 
                    className="bg-muted" 
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Email cannot be changed at this time
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input 
                    id="userId" 
                    value={user.id} 
                    disabled 
                    className="bg-muted font-mono text-sm" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security</span>
                </CardTitle>
                <CardDescription>
                  Update your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Enter new password" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm new password" 
                  />
                </div>

                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isUpdatingPassword || !newPassword || !confirmPassword} 
                  className="w-full sm:w-auto"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Subscription Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Subscription</span>
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading subscription...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Current Plan</Label>
                        <p className="text-lg font-medium">
                          {subscription?.plan === 'none' ? 'No Active Plan' : subscription?.plan?.replace('_', ' ') || 'Loading...'}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Client Limit</Label>
                        <p className="text-lg font-medium">
                          {subscription?.client_limit === -1 
                            ? 'Unlimited' 
                            : subscription?.client_limit === 0 
                            ? 'No clients allowed' 
                            : `${subscription?.client_limit || 0} clients`
                          }
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-3">
                      {hasActiveSubscription && (
                        <Button onClick={handleManageSubscription} variant="outline">
                          Manage Subscription
                        </Button>
                      )}
                      
                      <Button onClick={handleChangePlan}>
                        {hasActiveSubscription ? 'Change Plan' : 'Choose Plan'}
                      </Button>
                    </div>

                    {!hasActiveSubscription && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          You don't have an active subscription. Choose a plan to start using GrowthScript features.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Actions that cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
