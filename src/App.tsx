import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type {
  CoSoDuLieuGiaPha,
  PhamViDuAn,
  ScreenId,
  ThanhVienPhaHe,
  ThongTinCuonGiaPha,
  TrangGiaPha,
  XacNhanCongBoDongHo,
} from './types/giapha';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { PagesScreen } from './components/PagesScreen';
import { ComparisonScreen } from './components/ComparisonScreen';
import { GenealogyTreeScreen } from './components/GenealogyTreeScreen';
import { SourcesConsentScreen } from './components/SourcesConsentScreen';
import { QAScreen } from './components/QAScreen';
import { AboutScreen } from './components/AboutScreen';

const DEFAULT_PHAM_VI: PhamViDuAn = {
  ten_ung_dung: 'Gia Phả Số – Cội Nguồn Việt',
  ten_tieng_anh: 'Vietnamese Digital Genealogy',
  ma_de_tai: 'B02',
  nhom_y_tuong: 'Tư liệu Hán Nôm còn trong cộng đồng',
  ten_de_tai: 'Gia phả dòng họ từ bản chép tay sang bản số',
  mo_ta_pham_vi:
    'Số hóa một cuốn gia phả cụ thể của một dòng họ từ bản chép tay sang bản số, bảo tồn ảnh từng trang gốc, đối chiếu bản nhập, dựng cây phả hệ và xác nhận đồng ý công bố.',
  don_vi_thuc_hien:
    'Sản phẩm thực tập của Nguyễn Văn An, mã sinh viên PH70154, mã đề tài B02, Chương trình Thực tập sinh Đợt 15 FPT Polytechnic và IMTA TECH, dự án xã hội phi lợi nhuận.',
  nguyen_tac_bao_ton: [],
  nguon_tham_khao_chinh: [],
};

const EMPTY_DB: CoSoDuLieuGiaPha = {
  cuon_gia_pha: {
    identifier: '',
    title: '',
    ten_dong_ho: '',
    chi_phai: '',
    creator: '',
    date: '',
    ngon_ngu_va_he_chu: '',
    loai_ban: 'Chưa xác định',
    chat_lieu: '',
    kich_thuoc: '',
    tinh_trang_vat_ly: '',
    so_trang_vat_ly: 0,
    noi_luu_giu_hien_nay: '',
    thon: '',
    xa_phuong: '',
    tinh_thanh_pho: '',
    nguoi_dang_luu_giu: '',
    thoi_diem_tiep_nhan: '',
    mo_ta_tong_quat: '',
    rights: '',
    ghi_chu: '',
  },
  xac_nhan_cong_bo: {
    da_dong_y_cong_bo: false,
    ho_ten_nguoi_dai_dien: '',
    vai_tro_trong_dong_ho: '',
    ngay_xac_nhan: '',
    pham_vi_cong_khai: 'Hạn chế / Nội bộ',
    cho_phep_hien_thi_anh_goc: false,
    cho_phep_xuat_ban_so: false,
    noi_dung_han_che_rieng_tu:
      'Không công khai thông tin cá nhân riêng tư của người còn sống, địa chỉ liên hệ riêng hoặc nội dung chưa được người đại diện dòng họ cho phép.',
    ghi_chu_xac_nhan: '',
  },
  trang_ban_goc: [],
  thanh_vien_pha_he: [],
};

function parseHash(): { screen: ScreenId; pageId?: string } {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === 'trang-chu') return { screen: 'trang-chu' };
  if (hash === 'trang-tu-lieu') return { screen: 'trang-tu-lieu' };
  if (hash === 'doi-chieu') return { screen: 'doi-chieu' };
  if (hash.startsWith('doi-chieu/')) {
    const pageId = decodeURIComponent(hash.slice('doi-chieu/'.length));
    return { screen: 'doi-chieu', pageId };
  }
  if (hash === 'pha-he') return { screen: 'pha-he' };
  if (hash === 'nguon-cong-bo') return { screen: 'nguon-cong-bo' };
  if (hash === 'hoi-dap') return { screen: 'hoi-dap' };
  if (hash === 'gioi-thieu') return { screen: 'gioi-thieu' };
  return { screen: 'trang-chu' };
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>(() => parseHash().screen);
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(
    () => parseHash().pageId
  );
  const [initialPageSearch, setInitialPageSearch] = useState('');

  const [phamVi, setPhamVi] = useState<PhamViDuAn>(DEFAULT_PHAM_VI);
  const [duLieu, setDuLieu] = useState<CoSoDuLieuGiaPha>(EMPTY_DB);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  const fetchArchiveData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/giapha');
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || 'Không thể tải dữ liệu từ giapha.json.');
        return;
      }
      if (data.phamVi) {
        setPhamVi(data.phamVi as PhamViDuAn);
        document.title = data.phamVi.ten_ung_dung || 'Gia Phả Số – Cội Nguồn Việt';
      }
      if (data.duLieu) {
        setDuLieu(data.duLieu as CoSoDuLieuGiaPha);
      }
    } catch {
      setLoadError('Lỗi kết nối tới máy chủ khi tải dữ liệu gia phả.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchiveData();
  }, [fetchArchiveData]);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setActiveScreen(parsed.screen);
      setSelectedPageId(parsed.pageId);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (screen: ScreenId, pageId?: string) => {
    setActiveScreen(screen);
    if (pageId !== undefined) {
      setSelectedPageId(pageId);
    } else if (screen !== 'doi-chieu') {
      setSelectedPageId(undefined);
    }
    const nextHash =
      screen === 'doi-chieu' && pageId
        ? `#doi-chieu/${encodeURIComponent(pageId)}`
        : `#${screen}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchFromHome = (keyword: string) => {
    setInitialPageSearch(keyword);
    navigateTo('trang-tu-lieu');
  };

  const handleOpenComparison = (pageId?: string) => {
    const targetId = pageId || duLieu.trang_ban_goc[0]?.id;
    navigateTo('doi-chieu', targetId);
  };

  const handleExportPublicJson = async () => {
    if (exporting) return;
    setExporting(true);
    setExportNotice('');
    try {
      const res = await fetch('/api/export-public');
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setExportNotice(
          errBody.error ||
            'Chưa đủ điều kiện xuất JSON công khai. Vui lòng kiểm tra Ô đồng ý công bố của dòng họ.'
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'giapha-cong-khai.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setExportNotice('Lỗi kết nối khi kiểm tra quyền xuất tệp JSON công khai.');
    } finally {
      setExporting(false);
    }
  };

  const handleBookUpdated = (book: ThongTinCuonGiaPha) => {
    setDuLieu((prev) => ({ ...prev, cuon_gia_pha: book }));
  };

  const handleConsentUpdated = (consent: XacNhanCongBoDongHo) => {
    setDuLieu((prev) => ({ ...prev, xac_nhan_cong_bo: consent }));
    setExportNotice('');
  };

  const handlePageSaved = (page: TrangGiaPha) => {
    setDuLieu((prev) => {
      const exists = prev.trang_ban_goc.some((p) => p.id === page.id);
      const nextPages = exists
        ? prev.trang_ban_goc.map((p) => (p.id === page.id ? page : p))
        : [...prev.trang_ban_goc, page];
      nextPages.sort((a, b) => a.so_trang - b.so_trang);
      return { ...prev, trang_ban_goc: nextPages };
    });
  };

  const handlePageDeleted = (deletedId: string, nextMembers: ThanhVienPhaHe[]) => {
    setDuLieu((prev) => ({
      ...prev,
      trang_ban_goc: prev.trang_ban_goc.filter((p) => p.id !== deletedId),
      thanh_vien_pha_he: nextMembers,
    }));
    if (selectedPageId === deletedId) {
      setSelectedPageId(undefined);
    }
  };

  const handleMemberSaved = (member: ThanhVienPhaHe) => {
    setDuLieu((prev) => {
      const exists = prev.thanh_vien_pha_he.some((m) => m.id === member.id);
      const nextMembers = exists
        ? prev.thanh_vien_pha_he.map((m) => (m.id === member.id ? member : m))
        : [...prev.thanh_vien_pha_he, member];
      nextMembers.sort((a, b) =>
        a.doi_thu !== b.doi_thu ? a.doi_thu - b.doi_thu : a.id.localeCompare(b.id)
      );
      return { ...prev, thanh_vien_pha_he: nextMembers };
    });
  };

  const handleMembersReplaced = (members: ThanhVienPhaHe[]) => {
    setDuLieu((prev) => ({ ...prev, thanh_vien_pha_he: members }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900">
      <Header
        activeScreen={activeScreen}
        onNavigate={(s) => navigateTo(s)}
        onExportPublicJson={handleExportPublicJson}
        exporting={exporting}
      />

      {exportNotice && (
        <div
          role="alert"
          className="bg-[#FEF3C7]/70 border-b border-[#D97706]/40 text-[#92400E]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{exportNotice}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setExportNotice('');
                  navigateTo('nguon-cong-bo');
                }}
                className="font-semibold underline hover:text-stone-900 whitespace-nowrap cursor-pointer"
              >
                Mở Ô đồng ý công bố
              </button>
              <button
                type="button"
                onClick={() => setExportNotice('')}
                aria-label="Đóng thông báo"
                className="p-1 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <p className="font-serif text-xl text-stone-800">
              Đang tải cơ sở dữ liệu cuốn gia phả...
            </p>
            <p className="text-xs text-stone-500">Đọc cấu trúc số hóa từ giapha.json</p>
          </div>
        ) : loadError ? (
          <div className="my-12 p-6 bg-red-50 border border-red-200 rounded-lg text-center space-y-3">
            <p className="font-semibold text-red-900">{loadError}</p>
            <button
              type="button"
              onClick={fetchArchiveData}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#9A3412] rounded-md cursor-pointer"
            >
              Thử tải lại dữ liệu
            </button>
          </div>
        ) : (
          <>
            {activeScreen === 'trang-chu' && (
              <HomeScreen
                phamVi={phamVi}
                duLieu={duLieu}
                onSearchSubmit={handleSearchFromHome}
                onNavigate={(s) => navigateTo(s)}
                onOpenComparison={handleOpenComparison}
              />
            )}

            {activeScreen === 'trang-tu-lieu' && (
              <PagesScreen
                duLieu={duLieu}
                initialSearch={initialPageSearch}
                onPageSaved={handlePageSaved}
                onPageDeleted={handlePageDeleted}
                onOpenComparison={(pageId) => handleOpenComparison(pageId)}
                onNavigate={(s) => navigateTo(s)}
              />
            )}

            {activeScreen === 'doi-chieu' && (
              <ComparisonScreen
                duLieu={duLieu}
                selectedPageId={selectedPageId}
                onSelectPage={(pageId) => navigateTo('doi-chieu', pageId)}
                onPageSaved={handlePageSaved}
                onNavigate={(s) => navigateTo(s)}
              />
            )}

            {activeScreen === 'pha-he' && (
              <GenealogyTreeScreen
                duLieu={duLieu}
                onMemberSaved={handleMemberSaved}
                onMembersReplaced={handleMembersReplaced}
                onOpenComparison={(pageId) => handleOpenComparison(pageId)}
                onNavigate={(s) => navigateTo(s)}
              />
            )}

            {activeScreen === 'nguon-cong-bo' && (
              <SourcesConsentScreen
                phamVi={phamVi}
                duLieu={duLieu}
                onBookUpdated={handleBookUpdated}
                onConsentUpdated={handleConsentUpdated}
                onExportPublicJson={handleExportPublicJson}
              />
            )}

            {activeScreen === 'hoi-dap' && (
              <QAScreen
                duLieu={duLieu}
                onOpenComparison={(pageId) => handleOpenComparison(pageId)}
                onNavigate={(s) => navigateTo(s)}
              />
            )}

            {activeScreen === 'gioi-thieu' && (
              <AboutScreen phamVi={phamVi} duLieu={duLieu} />
            )}
          </>
        )}
      </main>

      <Footer
        phamVi={phamVi}
        duLieu={duLieu}
        onNavigate={(s) => navigateTo(s)}
        onExportPublicJson={handleExportPublicJson}
      />
    </div>
  );
}
