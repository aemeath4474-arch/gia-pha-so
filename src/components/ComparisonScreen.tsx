import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Expand,
  FileSearch,
  GitFork,
  Save,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type {
  CoSoDuLieuGiaPha,
  KetQuaOcrGemini,
  NhomNoiDungTrang,
  ScreenId,
  TrangGiaPha,
  TrangThaiDoiChieu,
} from '../types/giapha';
import { MemberVerifyInline, PageVerifyInline } from './VerificationLabel';

interface ComparisonScreenProps {
  duLieu: CoSoDuLieuGiaPha;
  selectedPageId?: string;
  onSelectPage: (pageId: string) => void;
  onPageSaved: (page: TrangGiaPha) => void;
  onNavigate: (screen: ScreenId) => void;
}

const CONTENT_GROUPS: NhomNoiDungTrang[] = [
  'Bìa / Tựa',
  'Phả ký / Lịch sử dòng họ',
  'Phả đồ / Thế thứ',
  'Tiểu sử nhân vật',
  'Tộc ước / Hương hỏa / Khác',
];

const VERIFY_STATES: TrangThaiDoiChieu[] = [
  'Chưa nhập nội dung',
  'AI gợi ý (Chưa kiểm chứng)',
  'Đang đối chiếu',
  'Đã đối chiếu khớp bản gốc',
];

export function ComparisonScreen({
  duLieu,
  selectedPageId,
  onSelectPage,
  onPageSaved,
  onNavigate,
}: ComparisonScreenProps) {
  const pages = duLieu.trang_ban_goc;
  const currentIndex = useMemo(() => {
    if (pages.length === 0) return -1;
    const idx = pages.findIndex((p) => p.id === selectedPageId);
    return idx >= 0 ? idx : 0;
  }, [pages, selectedPageId]);

  const activePage = currentIndex >= 0 ? pages[currentIndex] : undefined;

  const [zoom, setZoom] = useState<'fit' | '100' | '150' | '200'>('fit');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [kyHieu, setKyHieu] = useState('');
  const [tieuDe, setTieuDe] = useState('');
  const [nhomNoiDung, setNhomNoiDung] = useState<NhomNoiDungTrang>('Phả ký / Lịch sử dòng họ');
  const [nguyenVan, setNguyenVan] = useState('');
  const [phienAm, setPhienAm] = useState('');
  const [dichNghia, setDichNghia] = useState('');
  const [tomTat, setTomTat] = useState('');
  const [ghiChuTrang, setGhiChuTrang] = useState('');

  const [trangThai, setTrangThai] = useState<TrangThaiDoiChieu>('Chưa nhập nội dung');
  const [nguoiDoiChieu, setNguoiDoiChieu] = useState('');
  const [ngayDoiChieu, setNgayDoiChieu] = useState('');
  const [xacNhanKhop, setXacNhanKhop] = useState(false);

  const [newImageBase64, setNewImageBase64] = useState('');
  const [newMimeType, setNewMimeType] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrContext, setOcrContext] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrResult, setOcrResult] = useState<KetQuaOcrGemini | null>(null);

  useEffect(() => {
    if (!activePage) return;
    setKyHieu(activePage.ky_hieu_trang_goc);
    setTieuDe(activePage.tieu_de_trang);
    setNhomNoiDung(activePage.nhom_noi_dung);
    setNguyenVan(activePage.noi_dung_ban_nhap.nguyen_van_chu_goc);
    setPhienAm(activePage.noi_dung_ban_nhap.phien_am);
    setDichNghia(activePage.noi_dung_ban_nhap.dich_nghia);
    setTomTat(activePage.noi_dung_ban_nhap.tom_tat_noi_dung);
    setGhiChuTrang(activePage.noi_dung_ban_nhap.ghi_chu_trang);
    setTrangThai(activePage.trang_thai_doi_chieu);
    setNguoiDoiChieu(activePage.nguoi_doi_chieu);
    setNgayDoiChieu(activePage.ngay_doi_chieu);
    setXacNhanKhop(activePage.trang_thai_doi_chieu === 'Đã đối chiếu khớp bản gốc');
    setNewImageBase64('');
    setNewMimeType('');
    setNewFileName('');
    setSaveMessage('');
    setSaveError('');
    setOcrResult(null);
    setOcrError('');
  }, [activePage]);

  const linkedMembers = useMemo(() => {
    if (!activePage) return [];
    return duLieu.thanh_vien_pha_he.filter((m) =>
      m.can_cu_trang_ids.includes(activePage.id)
    );
  }, [activePage, duLieu.thanh_vien_pha_he]);

  if (!activePage) {
    return (
      <div className="pt-8 space-y-6">
        <div className="border-b border-[#E5DFD3] pb-6 space-y-2">
          <p className="text-xs font-medium uppercase text-[#9A3412]">
            Chức năng lõi 2 — Đối chiếu bản gốc và bản nhập
          </p>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Đối chiếu ảnh bản gốc với nội dung bản số
          </h1>
        </div>

        <div className="bg-white border border-[#E5DFD3] rounded-lg p-8 sm:p-12 text-center space-y-4">
          <FileSearch className="w-10 h-10 text-stone-400 mx-auto" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-semibold text-stone-900">
            Chưa có trang gia phả nào để đối chiếu
          </h2>
          <p className="text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            Hãy nạp ảnh từng trang bản gốc tại mục <strong>Trang gốc</strong> trước. Sau khi có trang đầu tiên, bạn có thể xem song song ảnh bản gốc và nhập văn bản đối chiếu tại đây.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('trang-tu-lieu')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-md cursor-pointer min-h-[42px]"
          >
            <span>Đi tới Trang gốc để nạp ảnh</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  const previewSrc =
    newImageBase64 ||
    activePage.anh_ban_goc.duong_dan_anh ||
    '/tulieu/web/khung-mau-toan-trang.svg';
  const hasRealImage = Boolean(newImageBase64 || activePage.anh_ban_goc.duong_dan_anh);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSaveError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSaveError('Chỉ chấp nhận ảnh thật định dạng JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSaveError('Dung lượng ảnh vượt quá 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewImageBase64(String(reader.result || ''));
      setNewMimeType(file.type);
      setNewFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    if (ocrLoading) return;
    setOcrError('');
    setOcrResult(null);

    if (!hasRealImage) {
      setOcrError('Trang này chưa có ảnh chụp thật (JPG/PNG/WEBP). Vui lòng tải ảnh lên ở khung bên trái.');
      return;
    }

    setOcrLoading(true);
    try {
      const res = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: activePage.id,
          imageBase64: newImageBase64 || undefined,
          mimeType: newMimeType || undefined,
          savedImagePath: !newImageBase64 ? activePage.anh_ban_goc.duong_dan_anh : undefined,
          ghiChuNguCanh: ocrContext.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOcrError(data.error || 'Không thể chạy nhận diện chữ từ ảnh.');
        return;
      }
      setOcrResult(data as KetQuaOcrGemini);
    } catch {
      setOcrError('Lỗi kết nối máy chủ khi gọi Gemini hỗ trợ nhận diện chữ.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleApplyOcrSuggestion = () => {
    if (!ocrResult) return;
    if (ocrResult.van_ban_goc_nhan_dien) setNguyenVan(ocrResult.van_ban_goc_nhan_dien);
    if (ocrResult.phien_am_de_xuat) setPhienAm(ocrResult.phien_am_de_xuat);
    if (ocrResult.dich_nghia_de_xuat) setDichNghia(ocrResult.dich_nghia_de_xuat);
    setTrangThai('AI gợi ý (Chưa kiểm chứng)');
    setXacNhanKhop(false);
    setSaveMessage('Đã chép gợi ý từ Gemini vào ô biên tập với trạng thái "AI gợi ý (Chưa kiểm chứng)". Hãy đối chiếu lại với ảnh gốc trước khi lưu xác nhận.');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      const res = await fetch(`/api/giapha/pages/${encodeURIComponent(activePage.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ky_hieu_trang_goc: kyHieu.trim(),
          tieu_de_trang: tieuDe.trim(),
          nhom_noi_dung: nhomNoiDung,
          anh_ban_goc: {
            ...activePage.anh_ban_goc,
            ten_tep_goc: newFileName || activePage.anh_ban_goc.ten_tep_goc,
          },
          noi_dung_ban_nhap: {
            nguyen_van_chu_goc: nguyenVan,
            phien_am: phienAm,
            dich_nghia: dichNghia,
            tom_tat_noi_dung: tomTat,
            ghi_chu_trang: ghiChuTrang,
          },
          trang_thai_doi_chieu: trangThai,
          nguoi_doi_chieu: nguoiDoiChieu.trim(),
          ngay_doi_chieu: ngayDoiChieu.trim(),
          xac_nhan_doi_chieu: xacNhanKhop,
          imageBase64: newImageBase64 || undefined,
          mimeType: newMimeType || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Không thể lưu dữ liệu đối chiếu.');
        return;
      }
      onPageSaved(data.trang as TrangGiaPha);
      setNewImageBase64('');
      setNewMimeType('');
      setNewFileName('');
      setSaveMessage('Đã lưu nội dung đối chiếu vào giapha.json.');
    } catch {
      setSaveError('Lỗi kết nối máy chủ khi lưu đối chiếu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-8 space-y-6">
      {/* Top Bar & Page Selector */}
      <div className="border-b border-[#E5DFD3] pb-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('trang-tu-lieu')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#9A3412] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Quay lại danh sách trang gốc</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => onSelectPage(pages[currentIndex - 1].id)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#D6CEBE] rounded hover:bg-[#F3EFE7] disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>

            <select
              aria-label="Chọn trang cần đối chiếu"
              value={activePage.id}
              onChange={(e) => onSelectPage(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D6CEBE] rounded min-h-[36px]"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  Trang {p.so_trang} ({p.ky_hieu_trang_goc}) — {p.tieu_de_trang}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={currentIndex >= pages.length - 1}
              onClick={() => onSelectPage(pages[currentIndex + 1].id)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#D6CEBE] rounded hover:bg-[#F3EFE7] disabled:opacity-40 cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-stone-500 tabular-nums">
              {activePage.id} · Trang {activePage.so_trang} · {activePage.nhom_noi_dung}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              Đối chiếu bản gốc &amp; bản nhập: {activePage.tieu_de_trang}
            </h1>
          </div>
          <PageVerifyInline status={activePage.trang_thai_doi_chieu} />
        </div>
      </div>

      {/* Side-by-Side Comparison Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANE: Original Page Image */}
        <section className="lg:col-span-6 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white border border-[#E5DFD3] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5DFD3] bg-[#F3EFE7]/70 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-stone-800">
                Ảnh bản gốc ({hasRealImage ? 'Ảnh thực tế' : 'Khung chờ nạp ảnh thật'})
              </span>

              <div className="flex items-center gap-1.5 text-xs">
                {(['fit', '100', '150', '200'] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`px-2 py-1 rounded border text-xs font-mono cursor-pointer ${
                      zoom === z
                        ? 'bg-[#9A3412] text-white border-[#9A3412]'
                        : 'bg-white text-stone-700 border-[#D6CEBE] hover:bg-[#F3EFE7]'
                    }`}
                  >
                    {z === 'fit' ? 'Vừa khung' : `${z}%`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Phóng to toàn màn hình"
                  className="p-1.5 bg-white border border-[#D6CEBE] rounded hover:bg-[#F3EFE7] text-stone-700 cursor-pointer"
                >
                  <Expand className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="bg-[#F3EFE7] overflow-auto max-h-[620px] p-3 flex items-start justify-center">
              <img
                src={previewSrc}
                alt={activePage.tieu_de_trang}
                className={
                  zoom === 'fit'
                    ? 'max-w-full h-auto rounded border border-[#D6CEBE]'
                    : zoom === '100'
                    ? 'w-auto max-w-none rounded border border-[#D6CEBE]'
                    : zoom === '150'
                    ? 'w-[150%] max-w-none rounded border border-[#D6CEBE]'
                    : 'w-[200%] max-w-none rounded border border-[#D6CEBE]'
                }
              />
            </div>

            <div className="p-4 border-t border-[#E5DFD3] space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-stone-600 space-y-0.5">
                  <p>
                    <span className="font-semibold text-stone-800">Lưu trữ gốc:</span>{' '}
                    <code className="font-mono">{activePage.anh_ban_goc.anh_chat_luong_cao_luu_tru || '/tulieu/goc/'}</code>
                  </p>
                  {activePage.anh_ban_goc.chu_thich_anh && (
                    <p>
                      <span className="font-semibold text-stone-800">Ghi chú vật lý:</span>{' '}
                      {activePage.anh_ban_goc.chu_thich_anh}
                    </p>
                  )}
                </div>

                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FBF9F5] hover:bg-[#F3EFE7] border border-[#D6CEBE] rounded-md font-semibold text-stone-800 cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                  <span>{newFileName ? `Ảnh mới: ${newFileName}` : 'Tải / thay ảnh trang thật'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Gemini Hán Nôm Assist */}
          <div className="bg-white border border-[#E5DFD3] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOcrOpen((prev) => !prev)}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-2 bg-[#F3EFE7]/70 hover:bg-[#F3EFE7] text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9A3412] shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold text-stone-900">
                  Hỗ trợ nhận diện chữ Hán Nôm bằng Gemini (Tham khảo)
                </span>
              </div>
              {ocrOpen ? (
                <ChevronUp className="w-4 h-4 text-stone-600" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-600" aria-hidden="true" />
              )}
            </button>

            {ocrOpen && (
              <div className="p-4 space-y-3 border-t border-[#E5DFD3] text-xs">
                <p className="text-stone-600 leading-relaxed">
                  AI chỉ gợi ý trích chữ từ ảnh thật đang hiển thị ở khung trên. Mọi kết quả đều gắn nhãn{' '}
                  <strong className="text-[#9A3412]">CHƯA KIỂM CHỨNG</strong> và phải được đối chiếu trực tiếp với bản gốc.
                </p>

                <input
                  type="text"
                  value={ocrContext}
                  onChange={(e) => setOcrContext(e.target.value)}
                  placeholder="Ngữ cảnh bổ sung cho trang này (VD: chữ viết theo cột dọc từ phải sang trái)..."
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
                />

                <button
                  type="button"
                  disabled={ocrLoading || !hasRealImage}
                  onClick={handleRunOcr}
                  className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 rounded-md cursor-pointer min-h-[38px]"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{ocrLoading ? 'Đang đọc ảnh với Gemini...' : 'Nhận diện chữ từ ảnh trang gốc'}</span>
                </button>

                {ocrError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                    {ocrError}
                  </div>
                )}

                {ocrResult && (
                  <div className="p-3.5 bg-[#FEF3C7]/40 border border-[#D97706]/40 rounded space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#92400E] inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        Trạng thái: {ocrResult.trang_thai_kiem_chung}
                      </span>
                      <span className="text-stone-600">{ocrResult.he_chu_nhan_dien}</span>
                    </div>

                    {ocrResult.van_ban_goc_nhan_dien && (
                      <div>
                        <p className="font-semibold text-stone-700">Chữ gốc gợi ý:</p>
                        <p className="han-nom text-sm text-stone-900 whitespace-pre-wrap mt-0.5">
                          {ocrResult.van_ban_goc_nhan_dien}
                        </p>
                      </div>
                    )}

                    {ocrResult.phien_am_de_xuat && (
                      <div>
                        <p className="font-semibold text-stone-700">Phiên âm đề xuất:</p>
                        <p className="text-stone-800 whitespace-pre-wrap mt-0.5">
                          {ocrResult.phien_am_de_xuat}
                        </p>
                      </div>
                    )}

                    {ocrResult.dich_nghia_de_xuat && (
                      <div>
                        <p className="font-semibold text-stone-700">Dịch nghĩa đề xuất:</p>
                        <p className="text-stone-800 whitespace-pre-wrap mt-0.5">
                          {ocrResult.dich_nghia_de_xuat}
                        </p>
                      </div>
                    )}

                    {ocrResult.ghi_chu_do_tin_cay && (
                      <p className="text-stone-600 italic">{ocrResult.ghi_chu_do_tin_cay}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleApplyOcrSuggestion}
                      className="px-3 py-1.5 font-semibold text-stone-900 bg-white border border-[#D6CEBE] hover:bg-[#F3EFE7] rounded cursor-pointer"
                    >
                      Chép gợi ý sang ô bản nhập để đối chiếu
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: Digitized Text Editor & Verification Sign-off */}
        <section className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handleSave}
            className="bg-white border border-[#E5DFD3] rounded-lg p-5 sm:p-6 space-y-5"
          >
            <div className="border-b border-[#E5DFD3] pb-3">
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Nội dung bản nhập &amp; xác nhận đối chiếu
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Nhập chính xác từng dòng theo ảnh bản gốc ở cột bên trái.
              </p>
            </div>

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                {saveError}
              </div>
            )}
            {saveMessage && (
              <div className="p-3 bg-[#ECFDF5] border border-[#14532D]/30 rounded text-xs text-[#14532D] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{saveMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cmp-code" className="block text-xs font-semibold text-stone-700 mb-1">
                  Ký hiệu trang gốc
                </label>
                <input
                  id="cmp-code"
                  type="text"
                  value={kyHieu}
                  onChange={(e) => setKyHieu(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
                />
              </div>

              <div>
                <label htmlFor="cmp-group" className="block text-xs font-semibold text-stone-700 mb-1">
                  Nhóm nội dung
                </label>
                <select
                  id="cmp-group"
                  value={nhomNoiDung}
                  onChange={(e) => setNhomNoiDung(e.target.value as NhomNoiDungTrang)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
                >
                  {CONTENT_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="cmp-title" className="block text-xs font-semibold text-stone-700 mb-1">
                Tiêu đề trang
              </label>
              <input
                id="cmp-title"
                type="text"
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="cmp-orig" className="block text-xs font-semibold text-stone-700 mb-1">
                Nguyên văn chữ gốc (Chữ Hán, chữ Nôm hoặc Quốc ngữ nguyên bản)
              </label>
              <textarea
                id="cmp-orig"
                rows={4}
                value={nguyenVan}
                onChange={(e) => setNguyenVan(e.target.value)}
                placeholder="Ghi chép nguyên văn chữ nhìn thấy trên trang gốc; chữ mất nét ghi [khuyết]..."
                className="w-full px-3 py-2.5 text-base han-nom bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="cmp-translit" className="block text-xs font-semibold text-stone-700 mb-1">
                Phiên âm Hán Việt / Quốc ngữ đọc lại
              </label>
              <textarea
                id="cmp-translit"
                rows={3}
                value={phienAm}
                onChange={(e) => setPhienAm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="cmp-meaning" className="block text-xs font-semibold text-stone-700 mb-1">
                Dịch nghĩa tiếng Việt hiện đại
              </label>
              <textarea
                id="cmp-meaning"
                rows={4}
                value={dichNghia}
                onChange={(e) => setDichNghia(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cmp-summary" className="block text-xs font-semibold text-stone-700 mb-1">
                  Tóm tắt nội dung trang
                </label>
                <textarea
                  id="cmp-summary"
                  rows={2}
                  value={tomTat}
                  onChange={(e) => setTomTat(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
                />
              </div>

              <div>
                <label htmlFor="cmp-note" className="block text-xs font-semibold text-stone-700 mb-1">
                  Ghi chú hiệu đính / chữ mờ
                </label>
                <textarea
                  id="cmp-note"
                  rows={2}
                  value={ghiChuTrang}
                  onChange={(e) => setGhiChuTrang(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
                />
              </div>
            </div>

            {/* Verification Gate Box */}
            <div className="p-4 bg-[#F3EFE7] border border-[#D6CEBE] rounded-lg space-y-3">
              <p className="text-xs font-semibold uppercase text-stone-800">
                Xác nhận đối chiếu bản gốc &amp; bản nhập
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="cmp-status" className="block text-xs font-medium text-stone-700 mb-1">
                    Trạng thái đối chiếu
                  </label>
                  <select
                    id="cmp-status"
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value as TrangThaiDoiChieu)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-[#D6CEBE] rounded"
                  >
                    {VERIFY_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cmp-reviewer" className="block text-xs font-medium text-stone-700 mb-1">
                    Người đối chiếu
                  </label>
                  <input
                    id="cmp-reviewer"
                    type="text"
                    value={nguoiDoiChieu}
                    onChange={(e) => setNguoiDoiChieu(e.target.value)}
                    placeholder="Họ tên người kiểm tra"
                    className="w-full px-2.5 py-2 text-xs bg-white border border-[#D6CEBE] rounded"
                  />
                </div>

                <div>
                  <label htmlFor="cmp-rdate" className="block text-xs font-medium text-stone-700 mb-1">
                    Ngày đối chiếu
                  </label>
                  <input
                    id="cmp-rdate"
                    type="date"
                    value={ngayDoiChieu}
                    onChange={(e) => setNgayDoiChieu(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-[#D6CEBE] rounded"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-stone-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={xacNhanKhop}
                  onChange={(e) => setXacNhanKhop(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#14532D]"
                />
                <span>
                  Tôi xác nhận đã kiểm tra trực tiếp nội dung bản nhập với ảnh trang gốc (bắt buộc khi chọn trạng thái <strong>Đã đối chiếu khớp bản gốc</strong>).
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-md cursor-pointer min-h-[42px]"
              >
                <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{saving ? 'Đang lưu...' : 'Lưu đối chiếu trang'}</span>
              </button>
            </div>
          </form>

          {/* Linked Genealogy Members */}
          <div className="bg-white border border-[#E5DFD3] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Nhân vật phả hệ dẫn căn cứ từ trang này
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('pha-he')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mở sơ đồ phả hệ</span>
              </button>
            </div>

            {linkedMembers.length === 0 ? (
              <p className="text-xs text-stone-500">
                Chưa có nhân vật nào trong cây phả hệ gắn mã căn cứ trang {activePage.id}.
              </p>
            ) : (
              <ul className="divide-y divide-[#E5DFD3] text-xs">
                {linkedMembers.map((m) => (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-stone-900">
                        {m.an_thong_tin_rieng_tu ? '[Ẩn thông tin riêng tư]' : m.ho_ten}
                      </span>{' '}
                      <span className="text-stone-500">· Đời {m.doi_thu}</span>
                    </div>
                    <MemberVerifyInline status={m.trang_thai_kiem_chung} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh trang gốc toàn màn hình"
          className="fixed inset-0 z-50 bg-stone-950/90 flex flex-col"
        >
          <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between text-stone-200 text-xs">
            <span>
              {activePage.id} · Trang {activePage.so_trang} · {activePage.tieu_de_trang}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>Đóng</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
            <img
              src={previewSrc}
              alt={activePage.tieu_de_trang}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
