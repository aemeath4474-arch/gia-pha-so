import type { CoSoDuLieuGiaPha, PhamViDuAn, ScreenId } from '../types/giapha';

interface FooterProps {
  phamVi: PhamViDuAn;
  duLieu: CoSoDuLieuGiaPha;
  onNavigate: (screen: ScreenId) => void;
  onExportPublicJson: () => void;
}

export function Footer({
  phamVi,
  duLieu,
  onNavigate,
  onExportPublicJson,
}: FooterProps) {
  const { cuon_gia_pha: book, xac_nhan_cong_bo: consent } = duLieu;
  const bookLabel = book.title.trim() || 'Chưa nạp tên cuốn gia phả cụ thể';
  const idLabel = book.identifier.trim() ? ` [${book.identifier.trim()}]` : '';
  const clanLabel = book.ten_dong_ho.trim() || 'Chưa xác định dòng họ';
  const placeLabel = [
    book.noi_luu_giu_hien_nay,
    book.thon,
    book.xa_phuong,
    book.tinh_thanh_pho,
  ]
    .filter((v) => v && v.trim())
    .join(', ');

  return (
    <footer className="mt-20 border-t border-[#E5DFD3] bg-[#F3EFE7]/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              {phamVi.ten_ung_dung}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{phamVi.ten_tieng_anh}</p>
            <p className="mt-3 text-sm text-stone-600 leading-relaxed">
              Số hóa một cuốn gia phả cụ thể: <strong className="text-stone-800">{bookLabel}{idLabel}</strong> ({clanLabel}).{' '}
              {placeLabel ? `Thông tin lưu giữ & địa danh: ${placeLabel}.` : 'Chờ cập nhật địa điểm lưu giữ thực tế.'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-stone-500">
              Chức năng số hóa &amp; tra cứu
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-stone-700">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('trang-chu')}
                  className="hover:text-[#9A3412] transition-colors cursor-pointer text-left"
                >
                  Trang chủ dự án
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('trang-tu-lieu')}
                  className="hover:text-[#9A3412] transition-colors cursor-pointer text-left"
                >
                  Ảnh từng trang gốc
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('doi-chieu')}
                  className="hover:text-[#9A3412] transition-colors cursor-pointer text-left"
                >
                  Đối chiếu bản gốc &amp; bản nhập
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pha-he')}
                  className="hover:text-[#9A3412] transition-colors cursor-pointer text-left"
                >
                  Sơ đồ cây phả hệ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('nguon-cong-bo')}
                  className="hover:text-[#9A3412] transition-colors cursor-pointer text-left"
                >
                  Ô đồng ý công bố &amp; Nguồn
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('hoi-dap')}
                  className="hover:text-[#9A3412] transition-colors cursor-pointer text-left"
                >
                  Hỏi đáp tư liệu
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('gioi-thieu')}
                  className="hover:text-[#9A3412] transition-colors cursor-pointer text-left"
                >
                  Giới thiệu đề tài B02
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-stone-500">
              Kiểm soát công bố dòng họ
            </h3>
            <p className="mt-3 text-sm text-stone-600 leading-relaxed">
              Trạng thái hiện tại:{' '}
              <strong className="text-stone-900">
                {consent.da_dong_y_cong_bo ? 'Đã xác nhận đồng ý công bố' : 'Chưa đồng ý công bố'}
              </strong>{' '}
              ({consent.pham_vi_cong_khai}). Chỉ xuất tệp dữ liệu công khai khi có xác nhận hợp lệ của dòng họ.
            </p>
            <button
              type="button"
              onClick={onExportPublicJson}
              className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold text-stone-900 bg-white border border-[#D6CEBE] rounded-md hover:bg-[#FBF9F5] transition-colors cursor-pointer min-h-[40px] whitespace-nowrap shrink-0"
            >
              Xuất JSON dữ liệu công khai
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-stone-500">
          <p>{phamVi.don_vi_thuc_hien}</p>
          <p className="shrink-0 tabular-nums">Đề tài B02 · giapha.json · UTF-8</p>
        </div>
      </div>
    </footer>
  );
}
