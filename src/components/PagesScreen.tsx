import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowRight,
  Download,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  CoSoDuLieuGiaPha,
  NhomNoiDungTrang,
  ScreenId,
  ThanhVienPhaHe,
  TrangGiaPha,
  TrangThaiDoiChieu,
} from '../types/giapha';
import { PageVerifyInline } from './VerificationLabel';

interface PagesScreenProps {
  duLieu: CoSoDuLieuGiaPha;
  initialSearch?: string;
  onPageSaved: (page: TrangGiaPha) => void;
  onPageDeleted: (deletedId: string, nextMembers: ThanhVienPhaHe[]) => void;
  onOpenComparison: (pageId: string) => void;
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

export function PagesScreen({
  duLieu,
  initialSearch = '',
  onPageSaved,
  onPageDeleted,
  onOpenComparison,
  onNavigate,
}: PagesScreenProps) {
  const [keyword, setKeyword] = useState(initialSearch);
  const [filterGroup, setFilterGroup] = useState<string>('Tất cả');
  const [filterStatus, setFilterStatus] = useState<string>('Tất cả');

  const [showAddForm, setShowAddForm] = useState(false);
  const [soTrang, setSoTrang] = useState<number>(() => {
    const maxP = duLieu.trang_ban_goc.reduce((m, p) => Math.max(m, p.so_trang), 0);
    return maxP + 1;
  });
  const [kyHieuTrang, setKyHieuTrang] = useState('');
  const [tieuDeTrang, setTieuDeTrang] = useState('');
  const [nhomNoiDung, setNhomNoiDung] = useState<NhomNoiDungTrang>('Phả ký / Lịch sử dòng họ');
  const [ngayChup, setNgayChup] = useState('');
  const [nguonChup, setNguonChup] = useState('');
  const [chuThichAnh, setChuThichAnh] = useState('');
  const [duongDanLuuTruCao, setDuongDanLuuTruCao] = useState('/tulieu/goc/');
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [fileName, setFileName] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setKeyword(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const maxP = duLieu.trang_ban_goc.reduce((m, p) => Math.max(m, p.so_trang), 0);
    setSoTrang(maxP + 1);
  }, [duLieu.trang_ban_goc]);

  const filteredPages = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return duLieu.trang_ban_goc.filter((p) => {
      if (filterGroup !== 'Tất cả' && p.nhom_noi_dung !== filterGroup) return false;
      if (filterStatus !== 'Tất cả' && p.trang_thai_doi_chieu !== filterStatus) return false;
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        String(p.so_trang).includes(q) ||
        p.ky_hieu_trang_goc.toLowerCase().includes(q) ||
        p.tieu_de_trang.toLowerCase().includes(q) ||
        p.noi_dung_ban_nhap.nguyen_van_chu_goc.toLowerCase().includes(q) ||
        p.noi_dung_ban_nhap.phien_am.toLowerCase().includes(q) ||
        p.noi_dung_ban_nhap.dich_nghia.toLowerCase().includes(q)
      );
    });
  }, [duLieu.trang_ban_goc, filterGroup, filterStatus, keyword]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormError('');
    if (!file) {
      setImageBase64('');
      setMimeType('');
      setFileName('');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Chỉ chấp nhận ảnh thật định dạng JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Kích thước tệp ảnh vượt quá giới hạn 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(String(reader.result || ''));
      setMimeType(file.type);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePage = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/giapha/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          so_trang: Number(soTrang),
          ky_hieu_trang_goc: kyHieuTrang.trim() || `Trang ${soTrang}`,
          tieu_de_trang: tieuDeTrang.trim() || `Trang bản gốc số ${soTrang}`,
          nhom_noi_dung: nhomNoiDung,
          ngay_chup: ngayChup.trim(),
          nguon_chup: nguonChup.trim(),
          chu_thich_anh: chuThichAnh.trim(),
          anh_chat_luong_cao_luu_tru: duongDanLuuTruCao.trim() || '/tulieu/goc/',
          ten_tep_goc: fileName,
          imageBase64: imageBase64 || undefined,
          mimeType: mimeType || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Không thể lưu trang mới.');
        return;
      }
      onPageSaved(data.trang as TrangGiaPha);
      setKyHieuTrang('');
      setTieuDeTrang('');
      setChuThichAnh('');
      setImageBase64('');
      setMimeType('');
      setFileName('');
      setShowAddForm(false);
    } catch {
      setFormError('Lỗi kết nối máy chủ khi nạp trang gia phả mới.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    setDeletingId(pageId);
    try {
      const res = await fetch(`/api/giapha/pages/${encodeURIComponent(pageId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        onPageDeleted(pageId, data.thanh_vien_pha_he as ThanhVienPhaHe[]);
        setConfirmDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pt-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-[#E5DFD3] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-[#9A3412]">
            Chức năng lõi 1 — Quản lý ảnh từng trang bản gốc
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
            Ảnh từng trang cuốn gia phả
          </h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
            Lưu giữ ảnh chụp từng trang thật của cuốn gia phả đang số hóa ({duLieu.cuon_gia_pha.title || 'Chưa khai báo tên cuốn gia phả'}). Bản ảnh độ phân giải cao dùng bảo tồn được tách riêng khỏi bản nén hiển thị web.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/api/giapha/template"
            download="giapha-cau-truc-rong.json"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-900 bg-white border border-[#D6CEBE] hover:bg-[#F3EFE7] rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Tải cấu trúc giapha.json rỗng</span>
          </a>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{showAddForm ? 'Đóng biểu mẫu nạp trang' : 'Nạp trang gốc mới'}</span>
          </button>
        </div>
      </div>

      {/* Add Page Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreatePage}
          className="bg-white border border-[#D6CEBE] rounded-lg p-5 sm:p-6 space-y-5"
        >
          <div className="border-b border-[#E5DFD3] pb-3">
            <h2 className="font-serif text-xl font-semibold text-stone-900">
              Nạp trang mới vào cuốn gia phả
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Tải ảnh chụp thật (JPG, PNG, WEBP tối đa 10 MB) hoặc tạo trước khung trang theo số thứ tự để đính ảnh sau.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="page-num" className="block text-xs font-semibold text-stone-700 mb-1">
                Số trang trong sách <span className="text-[#9A3412]">*</span>
              </label>
              <input
                id="page-num"
                type="number"
                min={1}
                required
                value={soTrang}
                onChange={(e) => setSoTrang(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md tabular-nums min-h-[42px]"
              />
            </div>

            <div>
              <label htmlFor="page-code" className="block text-xs font-semibold text-stone-700 mb-1">
                Ký hiệu tờ / trang gốc
              </label>
              <input
                id="page-code"
                type="text"
                value={kyHieuTrang}
                onChange={(e) => setKyHieuTrang(e.target.value)}
                placeholder="VD: Tờ 1a, Trang bìa..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="page-title" className="block text-xs font-semibold text-stone-700 mb-1">
                Tiêu đề mô tả trang
              </label>
              <input
                id="page-title"
                type="text"
                value={tieuDeTrang}
                onChange={(e) => setTieuDeTrang(e.target.value)}
                placeholder="VD: Bìa ngoài / Lời tựa đầu sách / Phả đồ đời 1–3..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
              />
            </div>

            <div>
              <label htmlFor="page-group" className="block text-xs font-semibold text-stone-700 mb-1">
                Nhóm nội dung trang
              </label>
              <select
                id="page-group"
                value={nhomNoiDung}
                onChange={(e) => setNhomNoiDung(e.target.value as NhomNoiDungTrang)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
              >
                {CONTENT_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="page-date" className="block text-xs font-semibold text-stone-700 mb-1">
                Ngày chụp ảnh gốc
              </label>
              <input
                id="page-date"
                type="date"
                value={ngayChup}
                onChange={(e) => setNgayChup(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
              />
            </div>

            <div>
              <label htmlFor="page-src" className="block text-xs font-semibold text-stone-700 mb-1">
                Nguồn chụp / người chụp
              </label>
              <input
                id="page-src"
                type="text"
                value={nguonChup}
                onChange={(e) => setNguonChup(e.target.value)}
                placeholder="VD: Chụp tại nhà thờ họ..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
              />
            </div>

            <div>
              <label htmlFor="page-raw" className="block text-xs font-semibold text-stone-700 mb-1">
                Tham chiếu bản lưu trữ chất lượng cao
              </label>
              <input
                id="page-raw"
                type="text"
                value={duongDanLuuTruCao}
                onChange={(e) => setDuongDanLuuTruCao(e.target.value)}
                placeholder="/tulieu/goc/trang-001.tiff"
                className="w-full px-3 py-2 text-xs font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label htmlFor="page-file" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Tải ảnh chụp trang thật (JPG, PNG, WEBP — không bắt buộc nếu lập khung trước)
              </label>
              <label
                htmlFor="page-file"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#9A3412]/50 bg-[#FBF9F5] hover:bg-[#F3EFE7] rounded-md text-xs font-medium text-stone-800 cursor-pointer min-h-[48px]"
              >
                <Upload className="w-4 h-4 text-[#9A3412] shrink-0" aria-hidden="true" />
                <span>{fileName ? `Đã chọn: ${fileName}` : 'Chọn tệp ảnh chụp trang gia phả'}</span>
              </label>
              <input
                id="page-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>

            <div>
              <label htmlFor="page-caption" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Chú thích tình trạng vật lý trang (rách góc, ố mực, dấu triện...)
              </label>
              <input
                id="page-caption"
                type="text"
                value={chuThichAnh}
                onChange={(e) => setChuThichAnh(e.target.value)}
                placeholder="Ghi nhận tình trạng thực tế trên mặt giấy..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[48px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5DFD3]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-[#D6CEBE] rounded-md hover:bg-[#F3EFE7] cursor-pointer min-h-[40px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-md cursor-pointer min-h-[40px]"
            >
              <ImagePlus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{saving ? 'Đang lưu trang...' : 'Lưu trang vào giapha.json'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <section className="bg-white border border-[#E5DFD3] rounded-lg p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search
            className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo số trang, tiêu đề, nguyên văn, phiên âm..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
          />
        </div>

        <select
          aria-label="Lọc theo nhóm nội dung trang"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
        >
          <option value="Tất cả">Tất cả nhóm nội dung</option>
          {CONTENT_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          aria-label="Lọc theo trạng thái đối chiếu"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[42px]"
        >
          <option value="Tất cả">Tất cả trạng thái đối chiếu</option>
          {VERIFY_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </section>

      {/* Pages Grid or Honest Empty State */}
      {duLieu.trang_ban_goc.length === 0 ? (
        <div className="bg-white border border-[#E5DFD3] rounded-lg p-8 sm:p-12 text-center space-y-4">
          <ImagePlus className="w-10 h-10 text-stone-400 mx-auto" aria-hidden="true" />
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Chưa có trang bản gốc nào được nạp vào cuốn gia phả
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Nhấn nút <strong>&ldquo;Nạp trang gốc mới&rdquo;</strong> ở góc trên để tải lên ảnh chụp từng trang thật của cuốn gia phả, hoặc khai báo thông tin cuốn sách và xác nhận đồng ý tại{' '}
              <button
                type="button"
                onClick={() => onNavigate('nguon-cong-bo')}
                className="font-semibold text-[#9A3412] underline cursor-pointer"
              >
                Công bố &amp; Nguồn
              </button>
              .
            </p>
          </div>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="bg-white border border-[#E5DFD3] rounded-lg p-8 text-center space-y-2">
          <p className="font-serif text-lg font-semibold text-stone-900">
            Không tìm thấy trang nào khớp bộ lọc hiện tại
          </p>
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setFilterGroup('Tất cả');
              setFilterStatus('Tất cả');
            }}
            className="text-xs font-semibold text-[#9A3412] underline cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <article
              key={page.id}
              className="bg-white border border-[#E5DFD3] rounded-lg overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] bg-[#F3EFE7] border-b border-[#E5DFD3] relative overflow-hidden">
                  {page.anh_ban_goc.duong_dan_anh ? (
                    <img
                      src={page.anh_ban_goc.duong_dan_anh}
                      alt={page.tieu_de_trang}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative">
                      <img
                        src="/tulieu/web/khung-mau-toan-trang.svg"
                        alt="Chưa có ảnh chụp trang thật"
                        className="w-full h-full object-contain opacity-75"
                      />
                      <span className="absolute bottom-2 inset-x-3 text-[11px] font-medium text-stone-600 bg-[#FBF9F5]/90 border border-[#D6CEBE] rounded px-2 py-1">
                        Chờ nạp ảnh chụp thật (JPG/PNG/WEBP)
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-500 font-mono tabular-nums">
                    <span>
                      {page.id} · Trang {page.so_trang}
                    </span>
                    <span>{page.ky_hieu_trang_goc}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    {page.tieu_de_trang}
                  </h3>
                  <p className="text-xs text-stone-600">{page.nhom_noi_dung}</p>
                  <PageVerifyInline status={page.trang_thai_doi_chieu} />
                  {page.noi_dung_ban_nhap.tom_tat_noi_dung && (
                    <p className="text-xs text-stone-600 line-clamp-2 pt-1">
                      {page.noi_dung_ban_nhap.tom_tat_noi_dung}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-[#E5DFD3] bg-[#FBF9F5] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenComparison(page.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer"
                >
                  <span>Đối chiếu &amp; Nhập liệu</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                {confirmDeleteId === page.id ? (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      disabled={deletingId === page.id}
                      onClick={() => handleDeletePage(page.id)}
                      className="font-semibold text-red-700 hover:text-red-900 cursor-pointer"
                    >
                      {deletingId === page.id ? 'Đang xóa...' : 'Xác nhận xóa'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={`Xóa trang ${page.so_trang}`}
                    onClick={() => setConfirmDeleteId(page.id)}
                    className="p-1.5 text-stone-400 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
