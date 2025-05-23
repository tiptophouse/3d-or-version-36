
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AffiliateEarningsDashboard from "@/components/affiliate/AffiliateEarningsDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const AffiliateEarningsPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  
  // Redirect if not authenticated
  if (!user && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <AffiliateEarningsDashboard />
    </DashboardLayout>
  );
};

export default AffiliateEarningsPage;
