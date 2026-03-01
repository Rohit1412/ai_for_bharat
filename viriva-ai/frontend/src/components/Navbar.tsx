import { useState } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onChatOpen: () => void;
}

export function Navbar({ currentPage, onPageChange, onChatOpen }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-[#0f172a] to-[#1a2234] border-b border-[#22c55e]/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onPageChange('dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#22c55e] to-[#86efac] rounded-lg flex items-center justify-center">
              <span className="text-[#0f172a] font-bold text-sm">V</span>
            </div>
            <span className="text-white font-bold text-lg">Viriva AI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'dashboard'
                  ? 'bg-[#22c55e] text-[#0f172a]'
                  : 'text-[#cbd5e1] hover:text-[#22c55e]'
              }`}
              onClick={() => onPageChange('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'action-plan'
                  ? 'bg-[#22c55e] text-[#0f172a]'
                  : 'text-[#cbd5e1] hover:text-[#22c55e]'
              }`}
              onClick={() => onPageChange('action-plan')}
            >
              Action Plan Generator
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <button
              className="p-2 hover:bg-[#1e2937] rounded-lg text-[#22c55e] transition-all"
              onClick={onChatOpen}
              title="Ask Viriva AI"
            >
              <MessageCircle size={20} />
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-[#1e2937] rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="text-[#22c55e]" size={24} />
              ) : (
                <Menu className="text-[#22c55e]" size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1a2234] border-t border-[#22c55e]/20 py-4 space-y-2">
            <button
              className="w-full text-left px-4 py-2 rounded-lg text-[#cbd5e1] hover:bg-[#1e2937]"
              onClick={() => {
                onPageChange('dashboard');
                setMobileMenuOpen(false);
              }}
            >
              Dashboard
            </button>
            <button
              className="w-full text-left px-4 py-2 rounded-lg text-[#cbd5e1] hover:bg-[#1e2937]"
              onClick={() => {
                onPageChange('action-plan');
                setMobileMenuOpen(false);
              }}
            >
              Action Plan Generator
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
