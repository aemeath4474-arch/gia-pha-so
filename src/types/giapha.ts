export type LoaiBanCuonGiaPha =
  | 'Bản gốc chép tay'
  | 'Bản sao chép tay'
  | 'Bản in cổ / mộc bản'
  | 'Chưa xác định';

export type NhomNoiDungTrang =
  | 'Bìa / Tựa'
  | 'Phả ký / Lịch sử dòng họ'
  | 'Phả đồ / Thế thứ'
  | 'Tiểu sử nhân vật'
  | 'Tộc ước / Hương hỏa / Khác';

export type TrangThaiDoiChieu =
  | 'Chưa nhập nội dung'
  | 'AI gợi ý (Chưa kiểm chứng)'
  | 'Đang đối chiếu'
  | 'Đã đối chiếu khớp bản gốc';

export type TrangThaiKiemChungThanhVien =
  | 'Chưa kiểm chứng'
  | 'Đang đối chiếu'
  | 'Đã đối chiếu trang gốc';

export type PhamViCongKhai =
  | 'Công khai toàn phần'
  | 'Công khai có chọn lọc'
  | 'Hạn chế / Nội bộ';

export type NhomNguonThamKhao =
  | 'Nguồn nghiên cứu gia phả'
  | 'Nguồn tra cứu Hán Nôm'
  | 'Nguồn nghiên cứu bảo tồn, lưu trữ và số hóa';

export interface NguonThamKhao {
  id: number;
  ten_nguon: string;
  don_vi_cung_cap: string;
  duong_dan: string;
  nhom_nguon: NhomNguonThamKhao;
  trang_thai_truy_cap: string;
  mo_ta_gia_tri: string;
}

export interface ThongTinCuonGiaPha {
  identifier: string;
  title: string;
  ten_dong_ho: string;
  chi_phai: string;
  creator: string;
  date: string;
  ngon_ngu_va_he_chu: string;
  loai_ban: LoaiBanCuonGiaPha;
  chat_lieu: string;
  kich_thuoc: string;
  tinh_trang_vat_ly: string;
  so_trang_vat_ly: number;
  noi_luu_giu_hien_nay: string;
  thon: string;
  xa_phuong: string;
  tinh_thanh_pho: string;
  nguoi_dang_luu_giu: string;
  thoi_diem_tiep_nhan: string;
  mo_ta_tong_quat: string;
  rights: string;
  ghi_chu: string;
}

export interface XacNhanCongBoDongHo {
  da_dong_y_cong_bo: boolean;
  ho_ten_nguoi_dai_dien: string;
  vai_tro_trong_dong_ho: string;
  ngay_xac_nhan: string;
  pham_vi_cong_khai: PhamViCongKhai;
  cho_phep_hien_thi_anh_goc: boolean;
  cho_phep_xuat_ban_so: boolean;
  noi_dung_han_che_rieng_tu: string;
  ghi_chu_xac_nhan: string;
}

export interface AnhTrangGiaPha {
  duong_dan_anh: string;
  ten_tep_goc: string;
  chu_thich_anh: string;
  anh_chat_luong_cao_luu_tru: string;
  ngay_chup: string;
  nguon_chup: string;
}

export interface NoiDungBanNhapTrang {
  nguyen_van_chu_goc: string;
  phien_am: string;
  dich_nghia: string;
  tom_tat_noi_dung: string;
  ghi_chu_trang: string;
}

export interface TrangGiaPha {
  id: string;
  so_trang: number;
  ky_hieu_trang_goc: string;
  tieu_de_trang: string;
  nhom_noi_dung: NhomNoiDungTrang;
  anh_ban_goc: AnhTrangGiaPha;
  noi_dung_ban_nhap: NoiDungBanNhapTrang;
  trang_thai_doi_chieu: TrangThaiDoiChieu;
  nguoi_doi_chieu: string;
  ngay_doi_chieu: string;
}

export interface ThanhVienPhaHe {
  id: string;
  ho_ten: string;
  ten_huy_ten_tu: string;
  doi_thu: number;
  chi_phai: string;
  gioi_tinh: 'Nam' | 'Nữ' | 'Chưa rõ';
  cha_id: string | null;
  me_id: string | null;
  ten_vo_chong: string;
  nam_sinh: string;
  nam_mat_hoac_gio: string;
  vai_tro_tieu_su: string;
  can_cu_trang_ids: string[];
  trang_thai_kiem_chung: TrangThaiKiemChungThanhVien;
  la_nguoi_con_song: boolean;
  an_thong_tin_rieng_tu: boolean;
}

export interface CoSoDuLieuGiaPha {
  cuon_gia_pha: ThongTinCuonGiaPha;
  xac_nhan_cong_bo: XacNhanCongBoDongHo;
  trang_ban_goc: TrangGiaPha[];
  thanh_vien_pha_he: ThanhVienPhaHe[];
}

export interface PhamViDuAn {
  ten_ung_dung: string;
  ten_tieng_anh: string;
  ma_de_tai: string;
  nhom_y_tuong: string;
  ten_de_tai: string;
  mo_ta_pham_vi: string;
  don_vi_thuc_hien: string;
  nguyen_tac_bao_ton: string[];
  nguon_tham_khao_chinh: NguonThamKhao[];
}

export interface TrichDanTrang {
  ma_trang: string;
  so_trang: number;
  tieu_de: string;
  trang_thai_doi_chieu: string;
}

export interface KetQuaHoiDapGemini {
  cau_tra_loi: string;
  co_du_lieu_xac_minh: boolean;
  trich_dan: TrichDanTrang[];
  canh_bao: string;
}

export interface KetQuaOcrGemini {
  he_chu_nhan_dien: string;
  van_ban_goc_nhan_dien: string;
  phien_am_de_xuat: string;
  dich_nghia_de_xuat: string;
  giai_thich_tu_ngu: string;
  ghi_chu_do_tin_cay: string;
  trang_thai_kiem_chung: 'Chưa kiểm chứng';
}

export type ScreenId =
  | 'trang-chu'
  | 'trang-tu-lieu'
  | 'doi-chieu'
  | 'pha-he'
  | 'nguon-cong-bo'
  | 'hoi-dap'
  | 'gioi-thieu';
