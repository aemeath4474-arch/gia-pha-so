import { useState } from 'react';
import { Download, Menu, X } from 'lucide-react';
import type { ScreenId } from '../types/giapha';

interface HeaderProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onExportPublicJson: () => void;
  exporting?: boolean;
}

const NAV_ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'trang-chu', label: 'Trang chủ' },
  { id: 'trang-tu-lieu', label: 'Trang gốc' },
  { id: 'doi-chieu', label: 'Đối chiếu' },
  { id: 'pha-he', label: 'Phả hệ' },
  { id: 'nguon-cong-bo', label: 'Công bố & Nguồn' },
  { id: 'hoi-dap', label: 'Hỏi đáp tư liệu' },
  { id: 'gioi-thieu', label: 'Giới thiệu' },
];

export function Header({
  activeScreen,
  onNavigate,
  onExportPublicJson,
  exporting = false,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (id: ScreenId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E5DFD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-6">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleNav('trang-chu')}
          className="font-serif text-base sm:text-lg font-semibold text-stone-900 hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A3412] cursor-pointer"
        >
          Gia Phả Số – Cội Nguồn Việt
        </button>

        {/* Zone 2: Single-line nav links including Hỏi đáp tư liệu and Giới thiệu */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs xl:text-[13px] font-medium text-stone-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A3412] ${
                  isActive
                    ? 'text-stone-900 border-[#9A3412] font-semibold'
                    : 'border-transparent hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={exporting}
            onClick={onExportPublicJson}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 xl:px-4 py-2 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412] min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{exporting ? 'Đang kiểm tra...' : 'Xuất JSON công khai'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#E5DFD3] bg-white text-stone-800 hover:bg-[#F3EFE7] cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5DFD3] bg-[#FBF9F5] px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-[#F3EFE7] text-[#9A3412] font-semibold'
                    : 'text-stone-700 hover:bg-[#F3EFE7]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            disabled={exporting}
            onClick={() => {
              onExportPublicJson();
              setMobileMenuOpen(false);
            }}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-md min-h-[44px] cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Xuất JSON công khai</span>
          </button>
        </div>
      )}
    </header>
  );
}
