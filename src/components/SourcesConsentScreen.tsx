import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Lock,
  Save,
  ShieldCheck,
} from 'lucide-react';
import type {
  CoSoDuLieuGiaPha,
  LoaiBanCuonGiaPha,
  NhomNguonThamKhao,
  PhamViCongKhai,
  PhamViDuAn,
  ThongTinCuonGiaPha,
  XacNhanCongBoDongHo,
} from '../types/giapha';
import { ConsentInline } from './VerificationLabel';

interface SourcesConsentScreenProps {
  phamVi: PhamViDuAn;
  duLieu: CoSoDuLieuGiaPha;
  onBookUpdated: (book: ThongTinCuonGiaPha) => void;
  onConsentUpdated: (consent: XacNhanCongBoDongHo) => void;
  onExportPublicJson: () => void;
}

const LOAI_BAN_OPTIONS: LoaiBanCuonGiaPha[] = [
  'Chưa xác định',
  'Bản gốc chép tay',
  'Bản sao chép tay',
  'Bản in cổ / mộc bản',
];

const PHAM_VI_OPTIONS: PhamViCongKhai[] = [
  'Hạn chế / Nội bộ',
  'Công khai có chọn lọc',
  'Công khai toàn phần',
];

const REF_GROUPS: ('Tất cả' | NhomNguonThamKhao)[] = [
  'Tất cả',
  'Nguồn nghiên cứu gia phả',
  'Nguồn tra cứu Hán Nôm',
  'Nguồn nghiên cứu bảo tồn, lưu trữ và số hóa',
];

export function SourcesConsentScreen({
  phamVi,
  duLieu,
  onBookUpdated,
  onConsentUpdated,
  onExportPublicJson,
}: SourcesConsentScreenProps) {
  // Consent form state
  const [consentForm, setConsentForm] = useState<XacNhanCongBoDongHo>(
    duLieu.xac_nhan_cong_bo
  );
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentMsg, setConsentMsg] = useState('');
  const [consentErr, setConsentErr] = useState('');

  // Book metadata form state
  const [bookForm, setBookForm] = useState<ThongTinCuonGiaPha>(duLieu.cuon_gia_pha);
  const [savingBook, setSavingBook] = useState(false);
  const [bookMsg, setBookMsg] = useState('');
  const [bookErr, setBookErr] = useState('');

  // External references filter
  const [refFilter, setRefFilter] = useState<'Tất cả' | NhomNguonThamKhao>('Tất cả');

  useEffect(() => {
    setConsentForm(duLieu.xac_nhan_cong_bo);
  }, [duLieu.xac_nhan_cong_bo]);

  useEffect(() => {
    setBookForm(duLieu.cuon_gia_pha);
  }, [duLieu.cuon_gia_pha]);

  const filteredRefs = useMemo(() => {
    if (refFilter === 'Tất cả') return phamVi.nguon_tham_khao_chinh;
    return phamVi.nguon_tham_khao_chinh.filter((r) => r.nhom_nguon === refFilter);
  }, [phamVi.nguon_tham_khao_chinh, refFilter]);

  const handleSaveConsent = async (e: FormEvent) => {
    e.preventDefault();
    if (savingConsent) return;
    setSavingConsent(true);
    setConsentMsg('');
    setConsentErr('');
    try {
      const res = await fetch('/api/giapha/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setConsentErr(data.error || 'Không thể lưu xác nhận đồng ý công bố.');
        return;
      }
      onConsentUpdated(data.xac_nhan_cong_bo as XacNhanCongBoDongHo);
      setConsentMsg('Đã lưu trạng thái Ô đồng ý công bố của dòng họ vào giapha.json.');
    } catch {
      setConsentErr('Lỗi kết nối máy chủ khi lưu xác nhận công bố.');
    } finally {
      setSavingConsent(false);
    }
  };

  const handleSaveBook = async (e: FormEvent) => {
    e.preventDefault();
    if (savingBook) return;
    setSavingBook(true);
    setBookMsg('');
    setBookErr('');
    try {
      const res = await fetch('/api/giapha/book', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookErr(data.error || 'Không thể lưu hồ sơ cuốn gia phả.');
        return;
      }
      onBookUpdated(data.cuon_gia_pha as ThongTinCuonGiaPha);
      setBookMsg('Đã cập nhật thông tin cuốn gia phả gốc trong giapha.json.');
    } catch {
      setBookErr('Lỗi kết nối máy chủ khi lưu thông tin cuốn gia phả.');
    } finally {
      setSavingBook(false);
    }
  };

  return (
    <div className="pt-8 space-y-12">
      {/* Page Header */}
      <div className="border-b border-[#E5DFD3] pb-6 space-y-2">
        <p className="text-xs font-medium uppercase text-[#9A3412]">
          Chức năng lõi 4 — Quyền công bố dòng họ &amp; Tài liệu tham khảo
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
          Ô đồng ý công bố, Hồ sơ cuốn gia phả &amp; Nguồn tham khảo
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
          Phân biệt rạch ròi giữa <strong>cuốn gia phả thật của dòng họ</strong> đang được số hóa (chỉ công bố khi có xác nhận của người đại diện có thẩm quyền) và <strong>7 nguồn tài liệu tham khảo học thuật</strong> bên ngoài.
        </p>
      </div>

      {/* SECTION 1: CLAN CONSENT GATE */}
      <section aria-label="Ô đồng ý công bố của dòng họ" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#9A3412]" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              1. Ô đồng ý công bố của dòng họ
            </h2>
          </div>
          <ConsentInline consent={duLieu.xac_nhan_cong_bo} />
        </div>

        <form
          onSubmit={handleSaveConsent}
          className="bg-white border border-[#D6CEBE] rounded-lg p-5 sm:p-6 space-y-5"
        >
          {/* Prominent Checkbox Gate */}
          <label className="flex items-start gap-3 p-4 bg-[#F3EFE7] border border-[#D6CEBE] rounded-md cursor-pointer">
            <input
              type="checkbox"
              checked={consentForm.da_dong_y_cong_bo}
              onChange={(e) =>
                setConsentForm((prev) => ({
                  ...prev,
                  da_dong_y_cong_bo: e.target.checked,
                }))
              }
              className="mt-1 w-5 h-5 accent-[#14532D] shrink-0"
            />
            <div className="space-y-1">
              <span className="block text-sm font-semibold text-stone-900">
                Ô đồng ý công bố của dòng họ / người đại diện lưu giữ hợp pháp
              </span>
              <span className="block text-xs text-stone-700 leading-relaxed">
                Tôi xác nhận dòng họ hoặc chủ sở hữu hợp pháp cuốn gia phả đã đồng ý cho phép số hóa và công bố trong phạm vi lựa chọn bên dưới. Nếu chưa tích chọn ô này, hệ thống sẽ khóa chức năng xuất tệp JSON công khai.
              </span>
            </div>
          </label>

          {consentErr && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              {consentErr}
            </div>
          )}
          {consentMsg && (
            <div className="p-3 bg-[#ECFDF5] border border-[#14532D]/30 rounded text-xs text-[#14532D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{consentMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="c-rep" className="block text-xs font-semibold text-stone-700 mb-1">
                Họ tên người đại diện xác nhận
              </label>
              <input
                id="c-rep"
                type="text"
                value={consentForm.ho_ten_nguoi_dai_dien}
                onChange={(e) =>
                  setConsentForm((prev) => ({
                    ...prev,
                    ho_ten_nguoi_dai_dien: e.target.value,
                  }))
                }
                placeholder="Trưởng họ / Chủ sở hữu..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="c-role" className="block text-xs font-semibold text-stone-700 mb-1">
                Vai trò trong dòng họ
              </label>
              <input
                id="c-role"
                type="text"
                value={consentForm.vai_tro_trong_dong_ho}
                onChange={(e) =>
                  setConsentForm((prev) => ({
                    ...prev,
                    vai_tro_trong_dong_ho: e.target.value,
                  }))
                }
                placeholder="VD: Trưởng tộc, Đại diện Hội đồng gia tộc..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="c-date" className="block text-xs font-semibold text-stone-700 mb-1">
                Ngày xác nhận
              </label>
              <input
                id="c-date"
                type="date"
                value={consentForm.ngay_xac_nhan}
                onChange={(e) =>
                  setConsentForm((prev) => ({ ...prev, ngay_xac_nhan: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="c-scope" className="block text-xs font-semibold text-stone-700 mb-1">
                Phạm vi công khai
              </label>
              <select
                id="c-scope"
                value={consentForm.pham_vi_cong_khai}
                onChange={(e) =>
                  setConsentForm((prev) => ({
                    ...prev,
                    pham_vi_cong_khai: e.target.value as PhamViCongKhai,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              >
                {PHAM_VI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-stone-800">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consentForm.cho_phep_hien_thi_anh_goc}
                onChange={(e) =>
                  setConsentForm((prev) => ({
                    ...prev,
                    cho_phep_hien_thi_anh_goc: e.target.checked,
                  }))
                }
                className="accent-[#14532D]"
              />
              <span>Cho phép hiển thị &amp; dẫn ảnh trang gốc trong bản công khai</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consentForm.cho_phep_xuat_ban_so}
                onChange={(e) =>
                  setConsentForm((prev) => ({
                    ...prev,
                    cho_phep_xuat_ban_so: e.target.checked,
                  }))
                }
                className="accent-[#14532D]"
              />
              <span>Cho phép xuất tệp JSON dữ liệu số công khai</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-restrict" className="block text-xs font-semibold text-stone-700 mb-1">
                Nội dung hạn chế riêng tư
              </label>
              <textarea
                id="c-restrict"
                rows={2}
                value={consentForm.noi_dung_han_che_rieng_tu}
                onChange={(e) =>
                  setConsentForm((prev) => ({
                    ...prev,
                    noi_dung_han_che_rieng_tu: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="c-note" className="block text-xs font-semibold text-stone-700 mb-1">
                Ghi chú biên bản / văn bản thỏa thuận
              </label>
              <textarea
                id="c-note"
                rows={2}
                value={consentForm.ghi_chu_xac_nhan}
                onChange={(e) =>
                  setConsentForm((prev) => ({
                    ...prev,
                    ghi_chu_xac_nhan: e.target.value,
                  }))
                }
                placeholder="Ghi số biên bản họp họ hoặc văn bản ủy quyền nếu có..."
                className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5DFD3]">
            <button
              type="button"
              onClick={onExportPublicJson}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-900 bg-[#F3EFE7] hover:bg-[#E5DFD3] border border-[#D6CEBE] rounded-md cursor-pointer"
            >
              {duLieu.xac_nhan_cong_bo.da_dong_y_cong_bo ? (
                <Download className="w-4 h-4 text-[#14532D]" aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4 text-[#92400E]" aria-hidden="true" />
              )}
              <span>Kiểm tra &amp; xuất JSON công khai</span>
            </button>

            <button
              type="submit"
              disabled={savingConsent}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-md cursor-pointer"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{savingConsent ? 'Đang lưu...' : 'Lưu xác nhận đồng ý công bố'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: SINGLE BOOK METADATA */}
      <section aria-label="Hồ sơ cuốn gia phả gốc đang số hóa" className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#9A3412]" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-semibold text-stone-900">
            2. Thông tin cuốn gia phả gốc đang số hóa
          </h2>
        </div>

        <form
          onSubmit={handleSaveBook}
          className="bg-white border border-[#E5DFD3] rounded-lg p-5 sm:p-6 space-y-5"
        >
          <p className="text-xs text-stone-600">
            Để trống nếu chưa tiếp nhận cuốn gia phả thực tế. Không tự điền mặc định bất kỳ dòng họ nào khi chưa có tư liệu xác thực.
          </p>

          {bookErr && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              {bookErr}
            </div>
          )}
          {bookMsg && (
            <div className="p-3 bg-[#ECFDF5] border border-[#14532D]/30 rounded text-xs text-[#14532D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{bookMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="b-id" className="block text-xs font-semibold text-stone-700 mb-1">
                Mã định danh cuốn gia phả
              </label>
              <input
                id="b-id"
                type="text"
                value={bookForm.identifier}
                onChange={(e) => setBookForm((p) => ({ ...p, identifier: e.target.value }))}
                placeholder="VD: GP-B02-001"
                className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="b-title" className="block text-xs font-semibold text-stone-700 mb-1">
                Tên cuốn gia phả (theo bìa / tựa)
              </label>
              <input
                id="b-title"
                type="text"
                value={bookForm.title}
                onChange={(e) => setBookForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ghi nguyên văn tên cuốn gia phả thật khi tiếp nhận..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-clan" className="block text-xs font-semibold text-stone-700 mb-1">
                Tên dòng họ
              </label>
              <input
                id="b-clan"
                type="text"
                value={bookForm.ten_dong_ho}
                onChange={(e) => setBookForm((p) => ({ ...p, ten_dong_ho: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-branch" className="block text-xs font-semibold text-stone-700 mb-1">
                Chi phái (nếu có)
              </label>
              <input
                id="b-branch"
                type="text"
                value={bookForm.chi_phai}
                onChange={(e) => setBookForm((p) => ({ ...p, chi_phai: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-type" className="block text-xs font-semibold text-stone-700 mb-1">
                Loại bản
              </label>
              <select
                id="b-type"
                value={bookForm.loai_ban}
                onChange={(e) =>
                  setBookForm((p) => ({
                    ...p,
                    loai_ban: e.target.value as LoaiBanCuonGiaPha,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              >
                {LOAI_BAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="b-creator" className="block text-xs font-semibold text-stone-700 mb-1">
                Người soạn / Người chép
              </label>
              <input
                id="b-creator"
                type="text"
                value={bookForm.creator}
                onChange={(e) => setBookForm((p) => ({ ...p, creator: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-date" className="block text-xs font-semibold text-stone-700 mb-1">
                Niên đại ghi trên bản gốc
              </label>
              <input
                id="b-date"
                type="text"
                value={bookForm.date}
                onChange={(e) => setBookForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-lang" className="block text-xs font-semibold text-stone-700 mb-1">
                Ngôn ngữ &amp; hệ chữ
              </label>
              <input
                id="b-lang"
                type="text"
                value={bookForm.ngon_ngu_va_he_chu}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, ngon_ngu_va_he_chu: e.target.value }))
                }
                placeholder="VD: Chữ Hán, chữ Nôm, Quốc ngữ..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-pages" className="block text-xs font-semibold text-stone-700 mb-1">
                Tổng số trang vật lý của cuốn sách
              </label>
              <input
                id="b-pages"
                type="number"
                min={0}
                value={bookForm.so_trang_vat_ly}
                onChange={(e) =>
                  setBookForm((p) => ({
                    ...p,
                    so_trang_vat_ly: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="b-material" className="block text-xs font-semibold text-stone-700 mb-1">
                Chất liệu
              </label>
              <input
                id="b-material"
                type="text"
                value={bookForm.chat_lieu}
                onChange={(e) => setBookForm((p) => ({ ...p, chat_lieu: e.target.value }))}
                placeholder="VD: Giấy dó, đóng chỉ..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-size" className="block text-xs font-semibold text-stone-700 mb-1">
                Kích thước
              </label>
              <input
                id="b-size"
                type="text"
                value={bookForm.kich_thuoc}
                onChange={(e) => setBookForm((p) => ({ ...p, kich_thuoc: e.target.value }))}
                placeholder="VD: 28 x 16 cm..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-cond" className="block text-xs font-semibold text-stone-700 mb-1">
                Tình trạng vật lý hiện tại
              </label>
              <input
                id="b-cond"
                type="text"
                value={bookForm.tinh_trang_vat_ly}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, tinh_trang_vat_ly: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-place" className="block text-xs font-semibold text-stone-700 mb-1">
                Nơi lưu giữ hiện nay
              </label>
              <input
                id="b-place"
                type="text"
                value={bookForm.noi_luu_giu_hien_nay}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, noi_luu_giu_hien_nay: e.target.value }))
                }
                placeholder="Nhà thờ họ / Thư viện lưu trữ..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-keeper" className="block text-xs font-semibold text-stone-700 mb-1">
                Người / đơn vị đang lưu giữ
              </label>
              <input
                id="b-keeper"
                type="text"
                value={bookForm.nguoi_dang_luu_giu}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, nguoi_dang_luu_giu: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-received" className="block text-xs font-semibold text-stone-700 mb-1">
                Thời điểm tiếp nhận / khảo sát
              </label>
              <input
                id="b-received"
                type="text"
                value={bookForm.thoi_diem_tiep_nhan}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, thoi_diem_tiep_nhan: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-hamlet" className="block text-xs font-semibold text-stone-700 mb-1">
                Làng / Thôn
              </label>
              <input
                id="b-hamlet"
                type="text"
                value={bookForm.thon}
                onChange={(e) => setBookForm((p) => ({ ...p, thon: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-ward" className="block text-xs font-semibold text-stone-700 mb-1">
                Xã / Phường
              </label>
              <input
                id="b-ward"
                type="text"
                value={bookForm.xa_phuong}
                onChange={(e) => setBookForm((p) => ({ ...p, xa_phuong: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-prov" className="block text-xs font-semibold text-stone-700 mb-1">
                Tỉnh / Thành phố
              </label>
              <input
                id="b-prov"
                type="text"
                value={bookForm.tinh_thanh_pho}
                onChange={(e) => setBookForm((p) => ({ ...p, tinh_thanh_pho: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="b-rights" className="block text-xs font-semibold text-stone-700 mb-1">
                Quyền sử dụng &amp; sao chụp tư liệu
              </label>
              <input
                id="b-rights"
                type="text"
                value={bookForm.rights}
                onChange={(e) => setBookForm((p) => ({ ...p, rights: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="b-note" className="block text-xs font-semibold text-stone-700 mb-1">
                Ghi chú kiểm chứng
              </label>
              <input
                id="b-note"
                type="text"
                value={bookForm.ghi_chu}
                onChange={(e) => setBookForm((p) => ({ ...p, ghi_chu: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>
          </div>

          <div>
            <label htmlFor="b-desc" className="block text-xs font-semibold text-stone-700 mb-1">
              Mô tả tổng quát cuốn gia phả
            </label>
            <textarea
              id="b-desc"
              rows={3}
              value={bookForm.mo_ta_tong_quat}
              onChange={(e) => setBookForm((p) => ({ ...p, mo_ta_tong_quat: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E5DFD3]">
            <button
              type="submit"
              disabled={savingBook}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-md cursor-pointer"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{savingBook ? 'Đang lưu...' : 'Lưu thông tin cuốn gia phả'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 3: 7 EXTERNAL ACADEMIC REFERENCES */}
      <section aria-label="7 nguồn tham khảo học thuật và tra cứu Hán Nôm" className="space-y-5">
        <div className="border-b border-[#E5DFD3] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              3. Nguồn tham khảo nghiệp vụ gia phả &amp; tra cứu Hán Nôm
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Đây là các nguồn thư mục, từ điển và tài liệu nghiệp vụ bên ngoài dùng hỗ trợ đọc chữ và biên mục — hoàn toàn độc lập với cuốn gia phả gốc của dòng họ.
            </p>
          </div>

          <select
            aria-label="Lọc nhóm nguồn tham khảo"
            value={refFilter}
            onChange={(e) => setRefFilter(e.target.value as 'Tất cả' | NhomNguonThamKhao)}
            className="px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-md min-h-[38px]"
          >
            {REF_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRefs.map((ref) => (
            <article
              key={ref.id}
              className="bg-white border border-[#E5DFD3] rounded-lg p-5 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                  <span className="font-medium text-[#9A3412]">{ref.nhom_nguon}</span>
                  <span className="font-mono tabular-nums">#{ref.id}</span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  {ref.ten_nguon}
                </h3>
                <p className="text-xs font-medium text-stone-700">{ref.don_vi_cung_cap}</p>
                <p className="text-xs text-stone-600 leading-relaxed">{ref.mo_ta_gia_tri}</p>
              </div>

              <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-between gap-3 text-xs">
                <span className="text-[#14532D] font-medium">{ref.trang_thai_truy_cap}</span>
                <a
                  href={ref.duong_dan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#9A3412] hover:text-[#7C2D12] shrink-0"
                >
                  <span>Mở nguồn</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
