import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  BookOpen,
  FileCheck2,
  GitFork,
  Images,
  MessageSquareText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { CoSoDuLieuGiaPha, PhamViDuAn, ScreenId } from '../types/giapha';
import { ConsentInline, PageVerifyInline } from './VerificationLabel';

interface HomeScreenProps {
  phamVi: PhamViDuAn;
  duLieu: CoSoDuLieuGiaPha;
  onSearchSubmit: (keyword: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenComparison: (pageId?: string) => void;
}

export function HomeScreen({
  phamVi,
  duLieu,
  onSearchSubmit,
  onNavigate,
  onOpenComparison,
}: HomeScreenProps) {
  const [keyword, setKeyword] = useState('');

  const { cuon_gia_pha: book, xac_nhan_cong_bo: consent, trang_ban_goc: pages, thanh_vien_pha_he: members } =
    duLieu;

  const totalPages = pages.length;
  const verifiedPages = pages.filter(
    (p) => p.trang_thai_doi_chieu === 'Đã đối chiếu khớp bản gốc'
  ).length;
  const totalMembers = members.length;
  const hasBookIdentity = Boolean(book.title.trim() || book.ten_dong_ho.trim());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit(keyword.trim());
  };

  return (
    <div className="space-y-14 pt-8 sm:pt-12">
      {/* Editorial Hero for Single-Book Digitization */}
      <section className="max-w-4xl space-y-6">
        <p className="text-xs font-medium uppercase text-[#9A3412]">
          Đề tài {phamVi.ma_de_tai} · Số hóa một cuốn gia phả cụ thể
        </p>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-stone-900 leading-[1.16] [text-wrap:balance]">
          {hasBookIdentity
            ? `${book.title || 'Cuốn gia phả dòng họ'} — ${book.ten_dong_ho || 'Chưa xác định dòng họ'}`
            : 'Gia Phả Số – Bảo tồn trọn vẹn một cuốn gia phả dòng họ từ bản chép tay sang bản số'}
        </h1>

        <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-3xl">
          {book.mo_ta_tong_quat.trim()
            ? book.mo_ta_tong_quat
            : phamVi.mo_ta_pham_vi}
        </p>

        {/* Search across pages */}
        <form onSubmit={handleSubmit} className="pt-1">
          <label htmlFor="home-search" className="sr-only">
            Tìm kiếm theo số trang, tiêu đề trang hoặc nội dung bản nhập
          </label>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="home-search"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo số trang, ký hiệu trang gốc, chữ phiên âm..."
                className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-[#D6CEBE] rounded-md text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#9A3412] min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <span>Tra cứu trang gốc</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </form>

        {/* Consent Status & Book Status Summary Strip */}
        <div className="pt-2 border-t border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <ConsentInline consent={consent} />
            <p className="text-xs text-stone-500">
              {consent.da_dong_y_cong_bo && consent.ho_ten_nguoi_dai_dien
                ? `Người đại diện xác nhận: ${consent.ho_ten_nguoi_dai_dien} (${consent.vai_tro_trong_dong_ho || 'Đại diện dòng họ'})`
                : 'Chưa có xác nhận đồng ý công bố của dòng họ. Bạn cần hoàn tất Ô đồng ý công bố trước khi xuất dữ liệu công khai.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('nguon-cong-bo')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-[#F3EFE7] hover:bg-[#E5DFD3]/70 border border-[#D6CEBE] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <ShieldCheck className="w-4 h-4 text-[#9A3412] shrink-0" aria-hidden="true" />
            <span>Mở Ô đồng ý công bố</span>
          </button>
        </div>
      </section>

      {/* 4-column KPI Strip */}
      <section aria-label="Tổng quan cuốn gia phả đang số hóa">
        <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-[#E5DFD3] divide-y lg:divide-y-0 lg:divide-x divide-[#E5DFD3] bg-[#F3EFE7]/50">
          <div className="p-5 sm:p-6">
            <p className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tabular-nums">
              {totalPages}
              {book.so_trang_vat_ly > 0 ? (
                <span className="text-lg font-normal text-stone-500">
                  /{book.so_trang_vat_ly}
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-stone-700">
              Ảnh trang gốc đã nạp
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Lưu trong giapha.json theo thứ tự trang
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="font-serif text-3xl sm:text-4xl font-semibold text-[#14532D] tabular-nums">
              {verifiedPages}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-stone-700">
              Trang đã đối chiếu khớp
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Xác nhận khớp trực tiếp với ảnh gốc
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tabular-nums">
              {totalMembers}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-stone-700">
              Nhân vật trong phả hệ
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Chỉ lập từ trang gia phả có căn cứ
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="font-serif text-xl sm:text-2xl font-semibold text-stone-900 leading-tight">
              {consent.da_dong_y_cong_bo ? 'Đã đồng ý' : 'Chưa công bố'}
            </p>
            <p className="mt-2 text-xs sm:text-sm font-medium text-stone-700">
              Quyền công bố dòng họ
            </p>
            <p className="mt-1 text-xs text-stone-500">{consent.pham_vi_cong_khai}</p>
          </div>
        </div>
      </section>

      {hasBookIdentity && (
        <section
          aria-label="Hồ sơ thư mục cuốn gia phả đang số hóa"
          className="bg-white border border-[#E5DFD3] rounded-lg p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD3] pb-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[#9A3412]">
                Hồ sơ thư mục cuốn gia phả đang theo dõi
              </p>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">
                {book.title} {book.identifier ? `(${book.identifier})` : ''}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('nguon-cong-bo')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer shrink-0"
            >
              <span>Xem &amp; chỉnh sửa toàn bộ trường thư mục</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-xs sm:text-sm">
            <div>
              <dt className="text-stone-500">Dòng họ &amp; phạm vi</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {book.ten_dong_ho || 'Chưa xác định'}
                {book.chi_phai ? ` — ${book.chi_phai}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Địa danh làng / xã / tỉnh</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {[book.thon, book.xa_phuong, book.tinh_thanh_pho].filter(Boolean).join(', ') ||
                  'Chưa bổ sung'}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Nơi lưu giữ được dẫn</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {book.noi_luu_giu_hien_nay || 'Chưa xác định'}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Loại bản &amp; hệ chữ</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {book.loai_ban}
                {book.ngon_ngu_va_he_chu ? ` · ${book.ngon_ngu_va_he_chu}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Tình trạng vật lý &amp; biên soạn</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {book.tinh_trang_vat_ly || 'Chờ khảo sát trực tiếp'}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Quyền khai thác &amp; công bố</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {book.rights || consent.pham_vi_cong_khai}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* 4 Core Mandatory Capabilities of Project B02 */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E5DFD3] pb-3">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              4 chức năng cốt lõi của đề tài B02
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Quy trình khép kín để số hóa một cuốn gia phả cụ thể từ bản chép tay sang bản số.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5DFD3] rounded-lg p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#9A3412]">
                <Images className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase">Chức năng 1</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Ảnh từng trang gốc
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Quản lý ảnh chụp từng trang theo số thứ tự của cuốn gia phả. Tải lên ảnh thật (JPG/PNG/WEBP) để xem bản web nhẹ, tách biệt với bản ảnh lưu trữ gốc chất lượng cao.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('trang-tu-lieu')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer self-start"
            >
              <span>Quản lý ảnh từng trang</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-white border border-[#E5DFD3] rounded-lg p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#9A3412]">
                <FileCheck2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase">Chức năng 2</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Đối chiếu bản gốc và bản nhập
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Hiển thị song song ảnh trang gốc phóng to cùng ô nhập nguyên văn chữ Hán Nôm / Quốc ngữ, phiên âm, dịch nghĩa và trợ lý Gemini gợi ý đọc chữ (luôn gắn nhãn Chưa kiểm chứng).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenComparison()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer self-start"
            >
              <span>Mở màn hình đối chiếu</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-white border border-[#E5DFD3] rounded-lg p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#9A3412]">
                <GitFork className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase">Chức năng 3</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Sơ đồ cây phả hệ
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Dựng cây phả hệ phân tầng theo đời thứ và liên kết cha – mẹ – con trực tiếp từ các trang đã đối chiếu. Bảo vệ quyền riêng tư cho người còn sống.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pha-he')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer self-start"
            >
              <span>Xem &amp; cập nhật cây phả hệ</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-white border border-[#E5DFD3] rounded-lg p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#9A3412]">
                <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase">Chức năng 4</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Ô đồng ý công bố của dòng họ
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Lưu xác nhận đồng ý của trưởng họ hoặc người đại diện có thẩm quyền, phạm vi công khai ảnh gốc và xuất tệp dữ liệu số cùng 7 nguồn tham khảo học thuật.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('nguon-cong-bo')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer self-start"
            >
              <span>Khai báo hồ sơ &amp; đồng ý công bố</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Current Book Status or Pages Preview */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E5DFD3] pb-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Tình trạng số hóa cuốn gia phả hiện tại
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Dữ liệu hiển thị trung thực theo tệp <code className="font-mono text-xs">giapha.json</code>.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onNavigate('hoi-dap')}
              className="inline-flex items-center gap-1.5 text-stone-700 hover:text-[#9A3412] cursor-pointer"
            >
              <MessageSquareText className="w-4 h-4" aria-hidden="true" />
              <span>Hỏi đáp tư liệu</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('gioi-thieu')}
              className="inline-flex items-center gap-1.5 text-stone-700 hover:text-[#9A3412] cursor-pointer"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Giới thiệu đề tài</span>
            </button>
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="bg-[#F3EFE7] border border-[#D6CEBE] rounded-lg p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold uppercase text-[#9A3412]">
                {hasBookIdentity
                  ? 'Đã ghi nhận hồ sơ thư mục — Chờ tư liệu ảnh trang gốc'
                  : 'Cơ sở dữ liệu đang ở trạng thái cấu trúc sạch'}
              </p>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Chưa nạp trang bản gốc hoặc nhân vật nào vào giapha.json
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                {hasBookIdentity
                  ? `Thông tin cuốn "${book.title}" (${book.identifier || 'chưa rõ ký hiệu'}) đã được ghi nhận từ nguồn dẫn. Hệ thống giữ trống danh sách ảnh trang và cây phả hệ cho tới khi có ảnh chụp thật và đối chiếu trực tiếp văn bản gốc.`
                  : 'Hệ thống giữ trống hoàn toàn cho đến khi bạn nhận được cuốn gia phả thật từ dòng họ: không tự điền mặc định tên dòng họ, không tạo ảnh giả và không suy đoán phả hệ.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('nguon-cong-bo')}
                className="px-4 py-2.5 text-xs font-semibold text-stone-900 bg-white border border-[#D6CEBE] hover:bg-[#FBF9F5] rounded-md whitespace-nowrap cursor-pointer min-h-[42px]"
              >
                {hasBookIdentity ? '1. Cập nhật hồ sơ & đồng ý công bố' : '1. Khai báo cuốn gia phả'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('trang-tu-lieu')}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-md whitespace-nowrap cursor-pointer min-h-[42px]"
              >
                2. Nạp ảnh trang gốc đầu tiên
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.slice(0, 6).map((page) => (
              <article
                key={page.id}
                className="bg-white border border-[#E5DFD3] rounded-lg overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-[4/3] bg-[#F3EFE7] border-b border-[#E5DFD3] relative overflow-hidden flex items-center justify-center">
                  {page.anh_ban_goc.duong_dan_anh ? (
                    <img
                      src={page.anh_ban_goc.duong_dan_anh}
                      alt={page.tieu_de_trang}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="/tulieu/web/khung-mau-toan-trang.svg"
                      alt="Khung chờ nạp ảnh chụp trang thật"
                      className="w-full h-full object-cover opacity-80"
                    />
                  )}
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs text-stone-500 font-mono tabular-nums">
                      <span>Trang {page.so_trang}</span>
                      <span>{page.nhom_noi_dung}</span>
                    </div>
                    <h3 className="font-serif text-base font-semibold text-stone-900">
                      {page.tieu_de_trang}
                    </h3>
                    <PageVerifyInline status={page.trang_thai_doi_chieu} />
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenComparison(page.id)}
                    className="pt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#9A3412] hover:text-[#7C2D12] cursor-pointer self-start"
                  >
                    <span>Đối chiếu bản gốc &amp; bản nhập</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
