
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserSubscription } from "@/hooks/useUserSubscription";

const Hero = () => {
  const { user } = useAuth();
  const { subscription, loading } = useUserSubscription();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      if (loading) return;
      
      // If user has a valid subscription, go to dashboard
      if (subscription && subscription.plan !== 'none' && subscription.client_limit !== -1) {
        navigate('/dashboard');
      } else {
        // If user has no subscription or is newly registered, go to billing
        navigate('/billing');
      }
    } else {
      navigate('/auth');
    }
  };

  const getButtonText = () => {
    if (!user) return "Get Started Now";
    if (loading) return "Loading...";
    if (subscription && subscription.plan !== 'none' && subscription.client_limit !== -1) return "Go to Dashboard";
    return "Choose Plan";
  };

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 blur-3xl" />
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            AI-Powered Growth for
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {" "}Marketing Agencies
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">AI-powered performance marketing strategist, built as an Agent, not a chat wrapper.</p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-3" 
              onClick={handleGetStarted}
              disabled={loading}
            >
              {getButtonText()}
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
