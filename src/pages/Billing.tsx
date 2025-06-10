
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';

const Billing = () => {
  const { subscription, loading, refetch } = useUserSubscription();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const plans = [
    {
      name: "Early Founder",
      price: "$49",
      description: "Perfect for agencies just getting started",
      features: [
        "1 client",
        "AI-powered growth strategies",
        "Email support",
        "Basic analytics",
        "Core AI assistant"
      ],
      planId: "early_founder",
      clientLimit: 1
    },
    {
      name: "Core Agency",
      price: "$199",
      description: "For established agencies ready to scale",
      features: [
        "5 clients",
        "Advanced AI assistant",
        "Priority support",
        "Advanced analytics",
        "Custom integrations",
        "Team collaboration",
        "Performance optimization"
      ],
      planId: "core_agency",
      clientLimit: 5,
      popular: true
    }
  ];

  // Check for payment success/cancel in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated.",
      });
      // Refresh subscription status
      handleRefreshSubscription();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. No charges were made.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;

    try {
      console.log('Creating checkout session for plan:', planId);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Error",
          description: "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Redirect to Stripe checkout in the same tab
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshSubscription = async () => {
    if (!user) return;

    try {
      console.log('Refreshing subscription status');
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Subscription check error:', error);
        toast({
          title: "Error",
          description: "Failed to refresh subscription status.",
          variant: "destructive",
        });
        return;
      }

      console.log('Subscription status updated:', data);
      toast({
        title: "Subscription Updated",
        description: "Your subscription status has been refreshed.",
      });
      
      // Trigger a refetch of subscription data
      refetch();
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
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

  const isNewUser = subscription && (subscription.plan === 'none' || subscription.client_limit === -1);
  const hasActiveSubscription = subscription && subscription.plan !== 'none' && subscription.client_limit > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent">
            GrowthScript
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">
              {isNewUser ? 'Welcome! Choose Your Plan' : 'Manage Your Subscription'}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {isNewUser 
                ? 'Get started by selecting a plan that fits your agency\'s needs'
                : 'Upgrade or change your current subscription plan'
              }
            </p>
            {hasActiveSubscription && (
              <div className="mt-4">
                <p className="text-sm text-green-500">
                  Current plan: {subscription.plan.replace('_', ' ')} ({subscription.client_limit} clients)
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.planId} className={`relative ${plan.popular ? 'border-purple-500 shadow-lg scale-105' : 'border-border/50'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                      : 'bg-primary hover:bg-primary/90'
                    }`}
                    onClick={() => handleSubscribe(plan.planId)}
                    disabled={subscription?.plan === plan.planId}
                  >
                    {subscription?.plan === plan.planId ? 'Current Plan' : (isNewUser ? 'Get Started' : 'Switch to This Plan')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {!isNewUser && (
            <div className="text-center mt-8">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Billing;
