
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardStatsProps {
  subscription: any;
  clientsCount: number;
}

const DashboardStats = ({ subscription, clientsCount }: DashboardStatsProps) => {
  return (
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
            <p className="text-lg font-semibold">{clientsCount}</p>
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
  );
};

export default DashboardStats;
