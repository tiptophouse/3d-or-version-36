
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  primaryAddress?: string;
  onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  primaryAddress, 
  onRefresh 
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Property Dashboard</h1>
        <p className="text-gray-600">
          {primaryAddress || 'Your monetization overview'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button asChild variant="outline">
          <Link to="/">
            <MapPin className="mr-2 h-4 w-4" />
            Analyze New Property
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
