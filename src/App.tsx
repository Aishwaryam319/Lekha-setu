import React, { useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { DocumentProvider } from './context/DocumentContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FloatingChatButton } from './components/FloatingChatButton';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { DepartmentSelection } from './pages/DepartmentSelection';
import { Upload } from './pages/Upload';
import { ScanDocument } from './pages/ScanDocument';
import { Processing } from './pages/Processing';
import { Verification } from './pages/Verification';
import { PendingDocuments } from './pages/PendingDocuments';
import { CompletedDocuments } from './pages/CompletedDocuments';
import { Records } from './pages/Records';
import { ChatAssistantPage } from './pages/ChatAssistantPage';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';

function AuthenticatedWorkspace() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF1F5] text-slate-900">
      {/* Karnataka State Top Hairline */}
      <div className="h-1 w-full flex shrink-0 no-print">
        <div className="flex-1 bg-[#EAB308]" />
        <div className="flex-1 bg-[#DC2626]" />
      </div>

      <div className="flex-1 flex min-w-0">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/department" element={<DepartmentSelection />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/scan" element={<ScanDocument />} />
              <Route path="/processing" element={<Processing />} />
              <Route path="/processing/:id" element={<Processing />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/verification/:id" element={<Verification />} />
              <Route path="/pending" element={<PendingDocuments />} />
              <Route path="/completed" element={<CompletedDocuments />} />
              <Route path="/records" element={<Records />} />
              <Route path="/assistant" element={<ChatAssistantPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="bg-white border-t border-slate-300 px-4 sm:px-6 py-3 text-[11px] text-slate-600 no-print">
            <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Content Owned &amp; Managed by Concerned Departments, Government of Karnataka · LEKHASETU Portal
              </span>
              <div className="flex items-center gap-4">
                <Link to="/department" className="hover:text-[#0C2340] hover:underline">
                  Department Directory
                </Link>
                <Link to="/help" className="hover:text-[#0C2340] hover:underline">
                  Help &amp; Guidelines
                </Link>
                <Link to="/settings" className="hover:text-[#0C2340] hover:underline">
                  Portal Settings
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <FloatingChatButton />
    </div>
  );
}

function AuthGate() {
  const { isAuthenticated, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F5F8] text-slate-600 text-sm">
        Loading LEKHASETU Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <NotificationProvider>
      <DocumentProvider>
        <AuthenticatedWorkspace />
      </DocumentProvider>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
