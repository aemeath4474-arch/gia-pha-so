import type { CoSoDuLieuGiaPha, PhamViDuAn } from '../types/giapha';

interface AboutScreenProps {
  phamVi: PhamViDuAn;
  duLieu: CoSoDuLieuGiaPha;
}

const DIGITIZATION_STEPS = [
  {
    step: '01',
    title: 'Tiếp nhận & Ô đồng ý công bố của dòng họ',
    desc: 'Ghi nhận thông tin cuốn gia phả cụ thể và xác nhận đồng ý của trưởng họ hoặc người đại diện lưu giữ hợp pháp tại Ô đồng ý công bố trước khi công khai.',
  },
  {
    step: '02',
    title: 'Quản lý ảnh từng trang bản gốc',
    desc: 'Chụp ảnh từng trang theo đúng thứ tự vật lý; lưu giữ riêng ảnh bảo tồn chất lượng cao (/tulieu/goc/) và bản hiển thị web (/tulieu/web/).',
  },
  {
    step: '03',
    title: 'Đối chiếu bản gốc & bản nhập số hóa',
    desc: 'Soi ảnh gốc song song với bản nhập nguyên văn Hán Nôm / Quốc ngữ, phiên âm, dịch nghĩa; Gemini hỗ trợ đọc chữ gợi ý (gắn nhãn Chưa kiểm chứng) cho tới khi có người xác nhận khớp bản gốc.',
  },
  {
    step: '04',
    title: 'Dựng sơ đồ cây phả hệ có căn cứ',
    desc: 'Lập cây phả hệ theo từng đời thứ, liên kết cha – mẹ – con trực tiếp tới mã trang gốc làm căn cứ và che ẩn thông tin cá nhân người còn sống khi cần.',
  },
];

export function AboutScreen({ phamVi, duLieu }: AboutScreenProps) {
  const { cuon_gia_pha: book, xac_nhan_cong_bo: consent } = duLieu;

  return (
    <div className="pt-8 space-y-12">
      <div className="border-b border-[#E5DFD3] pb-6 space-y-2">
        <p className="text-xs font-medium uppercase text-[#9A3412]">
          Đề tài {phamVi.ma_de_tai} · {phamVi.nhom_y_tuong}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
          Giới thiệu {phamVi.ten_ung_dung}
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
          {phamVi.ten_de_tai} ({phamVi.ten_tieng_anh}) — ứng dụng web tiếng Việt tập trung số hóa một cuốn gia phả cụ thể, giữ ảnh bản gốc, nhập nội dung đối chiếu và dựng sơ đồ cây phả hệ.
        </p>
      </div>

      {/* Mandatory Internship Attribution Block */}
      <section
        aria-label="Thông tin người thực hiện và dự án"
        className="bg-[#F3EFE7] border border-[#D6CEBE] rounded-lg p-6 sm:p-8 space-y-4"
      >
        <p className="text-xs font-semibold uppercase text-[#9A3412]">
          Thông tin người thực hiện &amp; ghi nhận đề tài
        </p>
        <p className="font-serif text-xl sm:text-2xl font-semibold text-stone-900 leading-snug">
          Sản phẩm thực tập của Nguyễn Văn An, mã sinh viên PH70154, mã đề tài B02, Chương trình Thực tập sinh Đợt 15 FPT Polytechnic và IMTA TECH, dự án xã hội phi lợi nhuận.
        </p>

        <dl className="pt-3 border-t border-[#D6CEBE] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <dt className="text-stone-500">Họ và tên / Mã sinh viên</dt>
            <dd className="font-semibold text-stone-900 mt-0.5">Nguyễn Văn An · PH70154</dd>
          </div>
          <div>
            <dt className="text-stone-500">Mã đề tài / Nhóm ý tưởng</dt>
            <dd className="font-semibold text-stone-900 mt-0.5">
              {phamVi.ma_de_tai} · {phamVi.nhom_y_tuong}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Tên đề tài</dt>
            <dd className="font-semibold text-stone-900 mt-0.5">{phamVi.ten_de_tai}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Tên ứng dụng</dt>
            <dd className="font-semibold text-stone-900 mt-0.5">
              {phamVi.ten_ung_dung} ({phamVi.ten_tieng_anh})
            </dd>
          </div>
        </dl>
      </section>

      {/* Goals & Current Book Status */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E5DFD3] rounded-lg p-6 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            Mục tiêu cốt lõi của đề tài B02
          </h2>
          <ul className="space-y-2 text-sm text-stone-700 list-disc pl-5 leading-relaxed">
            <li>
              Tập trung số hóa trọn vẹn một cuốn gia phả cụ thể, bảo tồn nguyên trạng từng trang ảnh bản gốc.
            </li>
            <li>
              Cung cấp giao diện đối chiếu trực quan giữa ảnh chụp bản gốc với bản nhập số hóa (chữ gốc, phiên âm, dịch nghĩa).
            </li>
            <li>
              Dựng sơ đồ cây phả hệ từ thông tin có căn cứ và tôn trọng tuyệt đối quyền công bố của dòng họ qua Ô đồng ý công bố.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#E5DFD3] rounded-lg p-6 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            Trạng thái cuốn gia phả trong hệ thống
          </h2>
          <dl className="divide-y divide-[#E5DFD3] text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-stone-500">Tên cuốn gia phả</dt>
              <dd className="text-stone-900 font-medium text-right">
                {book.title || 'Chưa khai báo (đang chờ tư liệu thật)'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-stone-500">Ký hiệu &amp; loại bản</dt>
              <dd className="text-stone-900 font-medium text-right">
                {book.identifier ? `${book.identifier} · ` : ''}
                {book.loai_ban}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-stone-500">Dòng họ &amp; địa danh</dt>
              <dd className="text-stone-900 font-medium text-right">
                {book.ten_dong_ho || 'Chưa xác định'}
                {[book.thon, book.xa_phuong, book.tinh_thanh_pho].filter(Boolean).length > 0
                  ? ` (${[book.thon, book.xa_phuong, book.tinh_thanh_pho].filter(Boolean).join(', ')})`
                  : ''}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-stone-500">Nơi lưu giữ &amp; hệ chữ</dt>
              <dd className="text-stone-900 font-medium text-right">
                {book.noi_luu_giu_hien_nay || 'Chưa xác định'}
                {book.ngon_ngu_va_he_chu ? ` · ${book.ngon_ngu_va_he_chu}` : ''}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-stone-500">Số trang / nhân vật đã nạp</dt>
              <dd className="text-stone-900 font-medium text-right tabular-nums">
                {duLieu.trang_ban_goc.length} trang · {duLieu.thanh_vien_pha_he.length} nhân vật
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-stone-500">Ô đồng ý công bố</dt>
              <dd className="text-stone-900 font-medium text-right">
                {consent.da_dong_y_cong_bo
                  ? `Đã đồng ý (${consent.ho_ten_nguoi_dai_dien})`
                  : 'Chưa xác nhận công bố'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 4-step Digitization Workflow */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-semibold text-stone-900 border-b border-[#E5DFD3] pb-3">
          Quy trình 4 bước số hóa một cuốn gia phả
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DIGITIZATION_STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-[#E5DFD3] rounded-lg p-5 space-y-2.5"
            >
              <p className="font-mono text-xs font-semibold text-[#9A3412] tabular-nums">
                Bước {item.step}
              </p>
              <h3 className="font-serif text-lg font-semibold text-stone-900">{item.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preservation Principles */}
      <section className="bg-white border border-[#E5DFD3] rounded-lg p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">
          Nguyên tắc bảo tồn &amp; trung thực tư liệu
        </h2>
        <ul className="space-y-2 text-sm text-stone-700 list-disc pl-5 leading-relaxed">
          {phamVi.nguyen_tac_bao_ton.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
