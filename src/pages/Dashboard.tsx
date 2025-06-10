import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { subscription, loading } = useUserSubscription();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    toast({
      title: "Profile",
      description: "Profile page coming soon!"
    });
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings page coming soon!"
    });
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to manage your subscription.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Opening customer portal for user:', user.email);
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Customer portal error:', error);
        // If portal is not configured, redirect to billing page
        if (error.message?.includes("Portal not configured") || data?.redirect_url) {
          toast({
            title: "Redirecting to Billing",
            description: "Opening billing page to manage your subscription.",
          });
          navigate('/billing');
          return;
        }
        
        toast({
          title: "Error",
          description: "Failed to open subscription management. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Handle the response from the edge function
      if (data?.redirect_url && data?.message) {
        toast({
          title: "Redirecting to Billing",
          description: data.message,
        });
        navigate('/billing');
        return;
      }

      if (data?.url) {
        // Open the customer portal in a new tab
        window.open(data.url, '_blank');
      } else {
        // Fallback to billing page
        toast({
          title: "Redirecting to Billing",
          description: "Opening billing page to manage your subscription.",
        });
        navigate('/billing');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast({
        title: "Redirecting to Billing",
        description: "Opening billing page to manage your subscription.",
      });
      navigate('/billing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <div className="container py-12 flex-1">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clients and grow your agency with AI-powered strategies.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium capitalize">{subscription?.plan?.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.client_limit} client{subscription?.client_limit !== 1 ? 's' : ''} allowed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Clients</CardTitle>
                <CardDescription>Clients you're currently managing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">
                    of {subscription?.client_limit} clients
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Strategies</CardTitle>
                <CardDescription>Generated growth strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">
                    Strategies created
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with managing your clients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full sm:w-auto" disabled>
                  Add New Client
                </Button>
                <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-4" disabled>
                  Generate Strategy
                </Button>
                <p className="text-sm text-muted-foreground">
                  Client management features coming soon!
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={handleManageSubscription}>
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
