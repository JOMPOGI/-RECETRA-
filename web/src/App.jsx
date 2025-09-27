import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InlineNotificationProvider } from './components/InlineNotificationSystem';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import AdminDashboard from './screens/AdminDashboard';
import EncoderDashboard from './screens/EncoderDashboard';
import ViewerDashboard from './screens/ViewerDashboard';
import IssueReceiptScreen from './screens/IssueReceiptScreen';
import ReceiptVerificationScreen from './screens/ReceiptVerificationScreen';
import FAQChatbotScreen from './screens/FAQChatbotScreen';
import ProfileScreen from './screens/ProfileScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import TemplateManagementScreen from './screens/TemplateManagementScreen';
import PaymentGatewayScreen from './screens/PaymentGatewayScreen';
import PaymentGatewayScreenSuccess from './screens/PaymentGatewayScreenSuccess';
import PaymentGatewayScreenCancel from './screens/PaymentGatewayScreenCancel';
import TransactionArchiveScreen from './screens/TransactionArchiveScreen';

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/faq" element={<FAQChatbotScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        {user.role === 'Admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagementScreen />} />
            <Route path="/admin/templates" element={<TemplateManagementScreen />} />
            <Route path="/admin/verify" element={<ReceiptVerificationScreen />} />
            <Route path="/admin/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        )}

        {user.role === 'Encoder' && (
          <>
            <Route path="/encoder" element={<EncoderDashboard />} />
            <Route path="/encoder/issue" element={<IssueReceiptScreen />} />
            <Route path="/encoder/archive" element={<TransactionArchiveScreen />} />
            <Route path="/encoder/verify" element={<ReceiptVerificationScreen />} />
            <Route path="/encoder/faq" element={<FAQChatbotScreen />} />
            <Route path="/encoder/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/encoder" replace />} />
          </>
        )}

        {user.role === 'Viewer' && (
          <>
            <Route path="/viewer" element={<ViewerDashboard />} />
            <Route path="/viewer/payment" element={<PaymentGatewayScreen />} />
            <Route path="/viewer/payment/success" element={<PaymentGatewayScreenSuccess />} />
            <Route path="/viewer/payment/cancel" element={<PaymentGatewayScreenCancel />} />
            <Route path="/viewer/verify" element={<ReceiptVerificationScreen />} />
            <Route path="/viewer/faq" element={<FAQChatbotScreen />} />
            <Route path="/viewer/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/viewer" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <InlineNotificationProvider>
        <AppContent />
      </InlineNotificationProvider>
    </AuthProvider>
  );
};

export default App;