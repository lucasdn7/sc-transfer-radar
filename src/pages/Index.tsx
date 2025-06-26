
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { ProcessList } from "@/components/ProcessList";
import { MunicipalityList } from "@/components/MunicipalityList";

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'processes':
        return <ProcessList />;
      case 'municipalities':
        return <MunicipalityList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

export default Index;
