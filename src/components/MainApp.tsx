import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Calendar, Tag, Bell, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, CreditCard, Globe, Banknote, CalendarRange, TrendingUp, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon, XMarkIcon, CheckIcon, PhotoIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import { useSupabase } from '../contexts/SupabaseContext';
import { LoginScreen } from './LoginScreen';
import { GoogleAuthDebug } from './GoogleAuthDebug';
import { AuthCallback } from './AuthCallback';
import { SupabaseDebugger } from './SupabaseDebugger';
import { EmergencyTroubleshooter } from './EmergencyTroubleshooter';
import SafeSubscriptionApp from './SafeSubscriptionApp';
import ErrorScenarioTester from './ErrorScenarioTester';
import SupabaseConnectionTest from './SupabaseConnectionTest';
import Header from './ui/header';
import StatsCard from './ui/stats-card';
import SubscriptionCard from './ui/subscription-card';
import SubscriptionForm from './ui/subscription-form';
import DebugPanel from './DebugPanel';
import { Button } from './ui/button';
import TestPage from '../pages/TestPage';
import { createDebugObject } from '../utils/responsive-debug';
import { ErrorDisplay } from './ErrorDisplay';
import { ErrorActionGenerator, useErrorHandler } from '../lib/errorHandlingSystem';
import { subscriptionErrorHandlers } from '../lib/supabaseWithErrorHandling';
import { useNetworkStatus } from '../lib/networkRecovery';
import { useSubscriptionManager } from '../hooks/useSubscriptionManager';
import { useNotificationManager } from '../hooks/useNotificationManager';
import { useProfileManager } from '../hooks/useProfileManager';
import { useCalendarManager } from '../hooks/useCalendarManager';
import { useAudioManager } from '../hooks/useAudioManager';
import { Subscription, AlarmHistory, Notification, CustomService, Profile } from '../types/subscription';
import SubscriptionView from './views/SubscriptionView';
import CalendarView from './views/CalendarView';
import AlarmsView from './views/AlarmsView';
import ProfileView from './views/ProfileView';
import ProfileEditModal from './modals/ProfileEditModal';

const MainApp = () => {
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase, updateProfile: updateSupabaseProfile } = useSupabase();
  
  // Custom hooks for different functionalities
  const subscriptionManager = useSubscriptionManager();
  const notificationManager = useNotificationManager();
  const profileManager = useProfileManager();
  const calendarManager = useCalendarManager();
  const audioManager = useAudioManager();
  
  // Error handling
  const { currentError: error, handleError: setError, clearError, retryLastAction } = useErrorHandler();
  const { isOnline, retryConnection } = useNetworkStatus();
  
  // State management
  const [currentView, setCurrentView] = useState<'subscriptions' | 'calendar' | 'alarms' | 'profile'>('subscriptions');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [showEmergencyTroubleshooter, setShowEmergencyTroubleshooter] = useState(false);
  
  // URL cleanup effect
  useEffect(() => {
    const handleURLCleanup = () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      
      if (params.has('error') || params.has('error_description')) {
        params.delete('error');
        params.delete('error_description');
        window.history.replaceState({}, document.title, url.pathname + url.hash);
      }
    };
    
    handleURLCleanup();
  }, []);

  // Initialize app data
  useEffect(() => {
    if (user && !authLoading) {
      subscriptionManager.loadUserData();
      notificationManager.loadUserNotifications();
    }
  }, [user, authLoading]);

  // Handle authentication state changes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/debug" element={<SupabaseDebugger />} />
          <Route path="/emergency" element={<EmergencyTroubleshooter />} />
          <Route path="/" element={
            <div className="flex flex-col min-h-screen">
              {/* Header */}
              <Header 
                user={user}
                profile={profileManager.profile}
                onLogout={profileManager.handleLogout}
                onProfileEdit={() => setIsProfileEditing(true)}
              />
              
              {/* Main Content */}
              <main className="flex-1 p-4 md:p-6">
                {/* Error Display */}
                {error && (
                  <ErrorDisplay 
                    error={error}
                    onRetry={() => retryLastAction(() => subscriptionManager.loadUserData())}
                    onDismiss={clearError}
                  />
                )}
                
                {/* Network Status */}
                {!isOnline && (
                  <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                    <p>인터넷 연결이 끊어졌습니다. 재연결을 시도합니다...</p>
                    <Button onClick={retryConnection} className="mt-2">
                      재연결 시도
                    </Button>
                  </div>
                )}
                
                {/* Navigation Tabs */}
                <div className="mb-6">
                  <nav className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
                    {[
                      { id: 'subscriptions', label: '구독', icon: Tag },
                      { id: 'calendar', label: '달력', icon: Calendar },
                      { id: 'alarms', label: '알림', icon: Bell },
                      { id: 'profile', label: '프로필', icon: UserCircleIcon }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setCurrentView(tab.id as any)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentView === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Content based on current view */}
                {currentView === 'subscriptions' && (
                  <SubscriptionView 
                    subscriptions={subscriptionManager.subscriptions}
                    onAddSubscription={() => setShowAddForm(true)}
                    onEditSubscription={setEditingSubscription}
                    onDeleteSubscription={subscriptionManager.handleDeleteSubscription}
                    totalAmount={subscriptionManager.totalAmount}
                    totalCount={subscriptionManager.totalCount}
                  />
                )}
                
                {currentView === 'calendar' && (
                  <CalendarView 
                    calendarManager={calendarManager}
                    subscriptions={subscriptionManager.subscriptions}
                    onEditSubscription={setEditingSubscription}
                  />
                )}
                
                {currentView === 'alarms' && (
                  <AlarmsView 
                    alarmHistory={notificationManager.alarmHistory}
                    notifications={notificationManager.notifications}
                    onClearAll={notificationManager.clearAllNotifications}
                    onRemoveNotification={notificationManager.removeNotification}
                  />
                )}
                
                {currentView === 'profile' && (
                  <ProfileView 
                    profileManager={profileManager}
                    isEditing={isProfileEditing}
                    onCancelEdit={() => setIsProfileEditing(false)}
                  />
                )}
              </main>
              
              {/* Modals */}
              {showAddForm && (
                <SubscriptionForm
                  isOpen={showAddForm}
                  onClose={() => setShowAddForm(false)}
                  onSubmit={subscriptionManager.handleAddSubscription}
                  mode="add"
                />
              )}
              
              {editingSubscription && (
                <SubscriptionForm
                  isOpen={!!editingSubscription}
                  onClose={() => setEditingSubscription(null)}
                  onSubmit={subscriptionManager.handleUpdateSubscription}
                  mode="edit"
                  subscription={editingSubscription}
                />
              )}
              
              {isProfileEditing && (
                <ProfileEditModal
                  profileManager={profileManager}
                  isOpen={isProfileEditing}
                  onClose={() => setIsProfileEditing(false)}
                />
              )}
              
              {/* Debug Panel */}
              {showDebugPanel && (
                <DebugPanel
                  isOpen={showDebugPanel}
                  onClose={() => setShowDebugPanel(false)}
                  user={user}
                  supabase={supabase}
                />
              )}
              
              {/* Emergency Troubleshooter */}
              {showEmergencyTroubleshooter && (
                <EmergencyTroubleshooter
                  isOpen={showEmergencyTroubleshooter}
                  onClose={() => setShowEmergencyTroubleshooter(false)}
                />
              )}
              
              {/* Toast Notifications */}
              <notificationManager.ToastContainer />
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default MainApp;