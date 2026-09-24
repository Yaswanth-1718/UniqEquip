import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api/client';

import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EquipmentCatalog from './components/EquipmentCatalog';
import RecommendationWizard from './components/RecommendationWizard';
import BookingStatusTracker from './components/BookingStatusTracker';
import AdminApprovalPortal from './components/AdminApprovalPortal';
import AnalyticsReports from './components/AnalyticsReports';
import BookingFormModal from './components/BookingFormModal';

function MainAppContent() {
  const { currentUser } = useAuth();
  const isAuthenticated = !!currentUser;
  
  const [activeTab, setActiveTab] = useState(
    currentUser?.role === 'ADMIN' ? 'dashboard' : (currentUser?.role === 'FACULTY' ? 'approval' : 'catalog')
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [initialPackageForModal, setInitialPackageForModal] = useState(null);

  // Enforce Dashboard is strictly restricted to ADMIN only
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== 'ADMIN' && activeTab === 'dashboard') {
        setActiveTab(currentUser.role === 'FACULTY' ? 'approval' : 'catalog');
      }
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    try {
      const eqData = await api.getEquipment();
      const bkData = await api.getBookings();
      const mtData = await api.getAnalytics();
      
      setEquipment(eqData);
      setBookings(bkData);
      setMetrics(mtData);

      if (currentUser?.role === 'ADMIN') {
        const usersData = await api.getPendingUsers();
        setPendingUsers(usersData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewBooking = () => {
    setInitialPackageForModal(null);
    setIsBookingModalOpen(true);
  };

  const handleOpenRecommendation = () => {
    setActiveTab('recommendation');
  };

  const handleApplyRecommendedPackage = (pkg) => {
    setInitialPackageForModal(pkg);
    setIsBookingModalOpen(true);
  };

  const handleAddToDraft = (item) => {
    setInitialPackageForModal({
      eventType: 'Event',
      audienceCount: 50,
      venueType: 'Campus Venue',
      recommendedItems: [{
        equipmentId: item.id,
        equipmentName: item.name,
        category: item.category,
        suggestedQuantity: 1
      }]
    });
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmitted = (newBooking) => {
    loadAllData();
    setActiveTab('tracker');
  };

  // Render Login Screen if user is not logged in
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  let pendingCount = 0;
  if (currentUser?.role === 'FACULTY') {
    pendingCount = bookings.filter(b => b.status === 'PENDING_FACULTY' && b.facultySupervisorId === currentUser.id).length;
  } else if (currentUser?.role === 'ADMIN') {
    pendingCount = bookings.filter(b => b.status === 'PENDING_ADMIN').length + pendingUsers.length;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <Navbar
        onOpenNewBooking={handleOpenNewBooking}
        onOpenRecommendation={handleOpenRecommendation}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingCount}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* View Content */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && currentUser?.role === 'ADMIN' && (
            <Dashboard
              metrics={metrics}
              bookings={bookings}
              onNavigateTab={setActiveTab}
              onOpenNewBooking={handleOpenNewBooking}
              onOpenRecommendation={handleOpenRecommendation}
            />
          )}

          {activeTab === 'catalog' && (
            <EquipmentCatalog
              equipment={equipment}
              onAddToDraft={handleAddToDraft}
              onEquipmentAdded={loadAllData}
            />
          )}

          {activeTab === 'recommendation' && (
            <RecommendationWizard
              onApplyRecommendedPackage={handleApplyRecommendedPackage}
            />
          )}

          {activeTab === 'tracker' && (
            <BookingStatusTracker
              bookings={bookings}
            />
          )}

          {activeTab === 'approval' && (
            <AdminApprovalPortal
              bookings={bookings}
              onWorkflowUpdate={loadAllData}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsReports
              metrics={metrics}
              bookings={bookings}
              equipment={equipment}
            />
          )}
        </main>

      </div>

      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialPackage={initialPackageForModal}
        onBookingSubmitted={handleBookingSubmitted}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
