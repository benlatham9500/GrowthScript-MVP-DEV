
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      title: "AI Client Assistant",
      description: "Each client gets a dedicated AI agent that understands their business and provides tailored marketing insights.",
      icon: "🤖"
    },
    {
      title: "Client Dashboard",
      description: "Manage all your clients from one centralized dashboard. Add, edit, and organize client accounts effortlessly.",
      icon: "📊"
    },
    {
      title: "Private Chat Channels",
      description: "Secure 1-on-1 chat interface with AI agents for each client. Get real-time responses and strategic advice.",
      icon: "💬"
    },
    {
      title: "Multi-Tier Pricing",
      description: "Flexible subscription plans that grow with your agency. From startups to enterprise-level solutions.",
      icon: "💳"
    },
    {
      title: "Real-time Analytics",
      description: "Track performance metrics, client engagement, and growth opportunities with advanced analytics.",
      icon: "📈"
    },
    {
      title: "Secure Authentication",
      description: "Enterprise-grade security with Google OAuth and email authentication powered by Supabase.",
      icon: "🔒"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to scale your agency
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed specifically for marketing agencies and their unique workflows.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="text-3xl mb-2">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
