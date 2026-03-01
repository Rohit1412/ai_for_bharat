import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ChatWidget } from './components/ChatWidget';
import { Dashboard } from './pages/Dashboard';
import { ActionPlan } from './pages/ActionPlan';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'action-plan'>('dashboard');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page as any)}
        onChatOpen={() => setChatOpen(true)}
      />

      {currentPage === 'dashboard' && <Dashboard onNavigate={(p) => setCurrentPage(p as 'dashboard' | 'action-plan')} />}
      {currentPage === 'action-plan' && <ActionPlan onNavigate={(p) => setCurrentPage(p as 'dashboard' | 'action-plan')} />}

      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}
    </div>
  );
}
