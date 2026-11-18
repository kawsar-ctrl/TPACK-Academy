import React, { useState } from 'react';
import { Leaf, Menu, X } from 'lucide-react';
import { NavTab } from '../types/lms';

interface TopBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenProfile: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'courses', label: 'কোর্সসমূহ' },
  { id: 'materials', label: 'প্রশিক্ষণ উপকরণ' },
  { id: 'quiz', label: 'কুইজ' },
  { id: 'calendar', label: 'প্রশিক্ষণ ক্যালেন্ডার' },
  { id: 'achievements', label: 'অর্জন ও ব্যাজ' },
  { id: 'certificate', label: 'সার্টিফিকেট' }
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onNavigate,
  onOpenProfile
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F6F8F6]/95 backdrop-blur-sm border-b border-[#DDE5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title (single line, no badges) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('courses');
          }}
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#132219] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] rounded-md"
        >
          <Leaf className="w-5 h-5 text-[#15803D]" aria-hidden="true" />
          <span className="font-display tracking-tight">TPACK Academy</span>
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'courses' && activeTab === 'classroom');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors duration-150 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] rounded-xs cursor-pointer ${
                  isActive
                    ? 'text-[#15803D] border-[#15803D] font-semibold'
                    : 'text-[#4A5D52] border-transparent hover:text-[#132219] hover:border-[#B6C7BC]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenProfile}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#15803D] cursor-pointer min-h-[40px]"
          >
            শিক্ষক প্রোফাইল
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#DDE5DF] bg-white text-[#132219] hover:bg-[#ECF2ED] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DDE5DF] bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'courses' && activeTab === 'classroom');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-[#ECF2ED] text-[#15803D] font-semibold'
                    : 'text-[#4A5D52] hover:bg-[#F6F8F6] hover:text-[#132219]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#DDE5DF]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors min-h-[44px] cursor-pointer"
            >
              শিক্ষক প্রোফাইল
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
