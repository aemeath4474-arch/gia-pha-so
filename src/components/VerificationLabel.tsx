import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import type {
  TrangThaiDoiChieu,
  TrangThaiKiemChungThanhVien,
  XacNhanCongBoDongHo,
} from '../types/giapha';

export function PageVerifyInline({ status }: { status: TrangThaiDoiChieu }) {
  if (status === 'Đã đối chiếu khớp bản gốc') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#14532D]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Đã đối chiếu khớp bản gốc</span>
      </span>
    );
  }
  if (status === 'Đang đối chiếu') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#92400E]">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Đang đối chiếu</span>
      </span>
    );
  }
  if (status === 'AI gợi ý (Chưa kiểm chứng)') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A3412]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>AI gợi ý (Chưa kiểm chứng)</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
      <FileWarning className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Chưa nhập nội dung</span>
    </span>
  );
}

export function MemberVerifyInline({
  status,
}: {
  status: TrangThaiKiemChungThanhVien;
}) {
  if (status === 'Đã đối chiếu trang gốc') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#14532D]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Đã đối chiếu trang gốc</span>
      </span>
    );
  }
  if (status === 'Đang đối chiếu') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#92400E]">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Đang đối chiếu</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A3412]">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Chưa kiểm chứng</span>
    </span>
  );
}

export function ConsentInline({ consent }: { consent: XacNhanCongBoDongHo }) {
  if (
    consent.da_dong_y_cong_bo &&
    consent.ho_ten_nguoi_dai_dien.trim() &&
    consent.pham_vi_cong_khai !== 'Hạn chế / Nội bộ'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#14532D]">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Dòng họ đã đồng ý công bố ({consent.pham_vi_cong_khai})</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#92400E]">
      <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Chưa xác nhận công bố ({consent.pham_vi_cong_khai})</span>
    </span>
  );
}
