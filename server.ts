import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  CoSoDuLieuGiaPha,
  KetQuaHoiDapGemini,
  KetQuaOcrGemini,
  PhamViDuAn,
  ThanhVienPhaHe,
  ThongTinCuonGiaPha,
  TrangGiaPha,
  XacNhanCongBoDongHo,
} from './src/types/giapha.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GIAPHA_FILE = path.join(__dirname, 'giapha.json');
const PHAMVI_FILE = path.join(__dirname, 'data', 'pham_vi_du_an.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const WEB_UPLOADS_DIR = path.join(PUBLIC_DIR, 'tulieu', 'web');

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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function readGiaphaDb(): Promise<CoSoDuLieuGiaPha> {
  try {
    const raw = await fs.readFile(GIAPHA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CoSoDuLieuGiaPha>;
    return {
      cuon_gia_pha: { ...EMPTY_DB.cuon_gia_pha, ...(parsed.cuon_gia_pha || {}) },
      xac_nhan_cong_bo: { ...EMPTY_DB.xac_nhan_cong_bo, ...(parsed.xac_nhan_cong_bo || {}) },
      trang_ban_goc: Array.isArray(parsed.trang_ban_goc) ? parsed.trang_ban_goc : [],
      thanh_vien_pha_he: Array.isArray(parsed.thanh_vien_pha_he) ? parsed.thanh_vien_pha_he : [],
    };
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

async function writeGiaphaDb(db: CoSoDuLieuGiaPha): Promise<void> {
  const sortedPages = [...db.trang_ban_goc].sort((a, b) => a.so_trang - b.so_trang);
  const sortedMembers = [...db.thanh_vien_pha_he].sort((a, b) => {
    if (a.doi_thu !== b.doi_thu) return a.doi_thu - b.doi_thu;
    return a.id.localeCompare(b.id);
  });
  const payload: CoSoDuLieuGiaPha = {
    ...db,
    trang_ban_goc: sortedPages,
    thanh_vien_pha_he: sortedMembers,
  };
  await fs.writeFile(GIAPHA_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
}

async function readPhamVi(): Promise<PhamViDuAn> {
  const raw = await fs.readFile(PHAMVI_FILE, 'utf-8');
  return JSON.parse(raw) as PhamViDuAn;
}

async function writePhamVi(data: PhamViDuAn): Promise<void> {
  await fs.writeFile(PHAMVI_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function saveUploadedImageFile(
  pageNumber: number,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('Chỉ chấp nhận ảnh thật định dạng JPG, PNG hoặc WEBP.');
  }
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('Dung lượng ảnh vượt quá 10 MB.');
  }

  await fs.mkdir(WEB_UPLOADS_DIR, { recursive: true });
  const padded = String(pageNumber).padStart(3, '0');
  const filename = `trang-${padded}-${Date.now()}.${ext}`;
  const fullPath = path.join(WEB_UPLOADS_DIR, filename);
  await fs.writeFile(fullPath, buffer);
  return `/tulieu/web/${filename}`;
}

function buildPublicExportPayload(db: CoSoDuLieuGiaPha, phamVi: PhamViDuAn) {
  const consent = db.xac_nhan_cong_bo;

  const publicPages = db.trang_ban_goc.map((p) => ({
    ...p,
    anh_ban_goc: consent.cho_phep_hien_thi_anh_goc
      ? p.anh_ban_goc
      : {
          ...p.anh_ban_goc,
          duong_dan_anh: '',
          anh_chat_luong_cao_luu_tru: '[Ẩn đường dẫn ảnh theo phạm vi đồng ý công bố]',
        },
  }));

  const publicMembers = db.thanh_vien_pha_he.map((m) => {
    if (m.an_thong_tin_rieng_tu || m.la_nguoi_con_song) {
      return {
        ...m,
        ho_ten: m.an_thong_tin_rieng_tu ? '[Ẩn thông tin cá nhân người còn sống]' : m.ho_ten,
        nam_sinh: m.an_thong_tin_rieng_tu ? '[Ẩn]' : m.nam_sinh,
        vai_tro_tieu_su: m.an_thong_tin_rieng_tu
          ? '[Ẩn chi tiết riêng tư theo quy định bảo vệ thông tin]'
          : m.vai_tro_tieu_su,
      };
    }
    return m;
  });

  return {
    thong_tin_xuat: {
      ten_ung_dung: phamVi.ten_ung_dung,
      ma_de_tai: phamVi.ma_de_tai,
      ngay_xuat_iso: new Date().toISOString(),
      nguoi_dai_dien_xac_nhan: consent.ho_ten_nguoi_dai_dien,
      vai_tro_xac_nhan: consent.vai_tro_trong_dong_ho,
      ngay_xac_nhan_dong_ho: consent.ngay_xac_nhan,
      pham_vi_cong_khai: consent.pham_vi_cong_khai,
      tong_so_trang_so_hoa: publicPages.length,
      tong_so_thanh_vien_pha_he: publicMembers.length,
    },
    cuon_gia_pha: db.cuon_gia_pha,
    xac_nhan_cong_bo: db.xac_nhan_cong_bo,
    trang_ban_goc: publicPages,
    thanh_vien_pha_he: publicMembers,
  };
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return {
      status: 403,
      message:
        'Chưa cấu hình hoặc khóa API Gemini không hợp lệ. Vui lòng kiểm tra mục Settings > Secrets trên hệ thống.',
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return {
      status: 429,
      message: 'Hệ thống đang chạm giới hạn lượt gọi mô hình Gemini. Vui lòng thử lại sau ít phút.',
    };
  }
  if (!process.env.GEMINI_API_KEY) {
    return {
      status: 503,
      message:
        'Chưa tìm thấy biến môi trường GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa trong Settings > Secrets.',
    };
  }
  return {
    status: 500,
    message: `Không thể kết nối mô hình Gemini tại thời điểm này (${msg}).`,
  };
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '18mb' }));
  app.use(express.static(PUBLIC_DIR));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/giapha', async (_req: Request, res: Response) => {
    try {
      const [duLieu, phamVi] = await Promise.all([readGiaphaDb(), readPhamVi()]);
      res.json({ phamVi, duLieu });
    } catch (err) {
      res.status(500).json({ error: 'Không thể đọc dữ liệu từ giapha.json', detail: String(err) });
    }
  });

  app.get('/api/giapha/template', (_req: Request, res: Response) => {
    const emptyTemplate: CoSoDuLieuGiaPha = {
      ...structuredClone(EMPTY_DB),
      trang_ban_goc: [
        {
          id: 'TRANG-001',
          so_trang: 1,
          ky_hieu_trang_goc: '',
          tieu_de_trang: '',
          nhom_noi_dung: 'Bìa / Tựa',
          anh_ban_goc: {
            duong_dan_anh: '',
            ten_tep_goc: '',
            chu_thich_anh: '',
            anh_chat_luong_cao_luu_tru: '/tulieu/goc/',
            ngay_chup: '',
            nguon_chup: '',
          },
          noi_dung_ban_nhap: {
            nguyen_van_chu_goc: '',
            phien_am: '',
            dich_nghia: '',
            tom_tat_noi_dung: '',
            ghi_chu_trang: '',
          },
          trang_thai_doi_chieu: 'Chưa nhập nội dung',
          nguoi_doi_chieu: '',
          ngay_doi_chieu: '',
        },
      ],
      thanh_vien_pha_he: [
        {
          id: 'TV-001',
          ho_ten: '',
          ten_huy_ten_tu: '',
          doi_thu: 1,
          chi_phai: '',
          gioi_tinh: 'Chưa rõ',
          cha_id: null,
          me_id: null,
          ten_vo_chong: '',
          nam_sinh: '',
          nam_mat_hoac_gio: '',
          vai_tro_tieu_su: '',
          can_cu_trang_ids: [],
          trang_thai_kiem_chung: 'Chưa kiểm chứng',
          la_nguoi_con_song: false,
          an_thong_tin_rieng_tu: false,
        },
      ],
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="giapha-cau-truc-rong.json"');
    res.send(JSON.stringify(emptyTemplate, null, 2));
  });

  app.get('/api/export-public', async (_req: Request, res: Response) => {
    try {
      const [db, phamVi] = await Promise.all([readGiaphaDb(), readPhamVi()]);
      const consent = db.xac_nhan_cong_bo;

      if (
        !consent.da_dong_y_cong_bo ||
        !consent.ho_ten_nguoi_dai_dien.trim() ||
        consent.pham_vi_cong_khai === 'Hạn chế / Nội bộ' ||
        !consent.cho_phep_xuat_ban_so
      ) {
        res.status(403).json({
          error:
            'Chưa đủ điều kiện xuất công khai: Vui lòng hoàn tất và đánh dấu "Ô đồng ý công bố của dòng họ" (kèm họ tên người đại diện, phạm vi không phải Hạn chế / Nội bộ và cho phép xuất bản số) tại mục Công bố & Nguồn.',
        });
        return;
      }

      const payload = buildPublicExportPayload(db, phamVi);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="giapha-cong-khai.json"');
      res.send(JSON.stringify(payload, null, 2));
    } catch (err) {
      res.status(500).json({ error: 'Lỗi khi xuất tệp JSON công khai', detail: String(err) });
    }
  });

  app.put('/api/pham-vi', async (req: Request, res: Response) => {
    try {
      const incoming = req.body as Partial<PhamViDuAn>;
      const current = await readPhamVi();
      const updated: PhamViDuAn = {
        ...current,
        ...incoming,
        nguyen_tac_bao_ton: Array.isArray(incoming.nguyen_tac_bao_ton)
          ? incoming.nguyen_tac_bao_ton
          : current.nguyen_tac_bao_ton,
        nguon_tham_khao_chinh: Array.isArray(incoming.nguon_tham_khao_chinh)
          ? incoming.nguon_tham_khao_chinh
          : current.nguon_tham_khao_chinh,
      };
      await writePhamVi(updated);
      res.json({ phamVi: updated });
    } catch (err) {
      res.status(500).json({ error: 'Không thể cập nhật thông tin phạm vi dự án', detail: String(err) });
    }
  });

  app.put('/api/giapha/book', async (req: Request, res: Response) => {
    try {
      const incoming = req.body as Partial<ThongTinCuonGiaPha>;
      const db = await readGiaphaDb();
      db.cuon_gia_pha = {
        ...db.cuon_gia_pha,
        ...incoming,
        so_trang_vat_ly: Math.max(0, Number(incoming.so_trang_vat_ly ?? db.cuon_gia_pha.so_trang_vat_ly) || 0),
      };
      await writeGiaphaDb(db);
      res.json({ cuon_gia_pha: db.cuon_gia_pha });
    } catch (err) {
      res.status(500).json({ error: 'Không thể lưu thông tin cuốn gia phả', detail: String(err) });
    }
  });

  app.put('/api/giapha/consent', async (req: Request, res: Response) => {
    try {
      const incoming = req.body as Partial<XacNhanCongBoDongHo>;
      if (incoming.da_dong_y_cong_bo && !incoming.ho_ten_nguoi_dai_dien?.trim()) {
        res.status(400).json({
          error:
            'Khi đánh dấu Ô đồng ý công bố của dòng họ, bắt buộc phải ghi rõ họ tên người đại diện / chủ sở hữu có thẩm quyền.',
        });
        return;
      }

      const db = await readGiaphaDb();
      db.xac_nhan_cong_bo = {
        ...db.xac_nhan_cong_bo,
        ...incoming,
        da_dong_y_cong_bo: Boolean(incoming.da_dong_y_cong_bo),
        cho_phep_hien_thi_anh_goc: Boolean(incoming.cho_phep_hien_thi_anh_goc),
        cho_phep_xuat_ban_so: Boolean(incoming.cho_phep_xuat_ban_so),
        ngay_xac_nhan:
          incoming.da_dong_y_cong_bo && !incoming.ngay_xac_nhan?.trim()
            ? new Date().toISOString().slice(0, 10)
            : incoming.ngay_xac_nhan ?? db.xac_nhan_cong_bo.ngay_xac_nhan,
      };
      await writeGiaphaDb(db);
      res.json({ xac_nhan_cong_bo: db.xac_nhan_cong_bo });
    } catch (err) {
      res.status(500).json({ error: 'Không thể cập nhật xác nhận đồng ý công bố', detail: String(err) });
    }
  });

  app.post('/api/giapha/pages', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        so_trang?: number;
        ky_hieu_trang_goc?: string;
        tieu_de_trang?: string;
        nhom_noi_dung?: TrangGiaPha['nhom_noi_dung'];
        chu_thich_anh?: string;
        anh_chat_luong_cao_luu_tru?: string;
        ngay_chup?: string;
        nguon_chup?: string;
        ten_tep_goc?: string;
        imageBase64?: string;
        mimeType?: string;
      };

      const db = await readGiaphaDb();
      const nextNum =
        typeof body.so_trang === 'number' && body.so_trang > 0
          ? body.so_trang
          : db.trang_ban_goc.reduce((max, p) => Math.max(max, p.so_trang), 0) + 1;

      if (db.trang_ban_goc.some((p) => p.so_trang === nextNum)) {
        res.status(409).json({
          error: `Trang số ${nextNum} đã tồn tại trong danh sách trang gốc.`,
        });
        return;
      }

      let savedPath = '';
      if (body.imageBase64 && body.mimeType) {
        savedPath = await saveUploadedImageFile(nextNum, body.imageBase64, body.mimeType);
      }

      const padded = String(nextNum).padStart(3, '0');
      const newPage: TrangGiaPha = {
        id: `TRANG-${padded}`,
        so_trang: nextNum,
        ky_hieu_trang_goc: body.ky_hieu_trang_goc?.trim() || `Trang ${nextNum}`,
        tieu_de_trang: body.tieu_de_trang?.trim() || `Trang bản gốc số ${nextNum}`,
        nhom_noi_dung: body.nhom_noi_dung || 'Phả ký / Lịch sử dòng họ',
        anh_ban_goc: {
          duong_dan_anh: savedPath,
          ten_tep_goc: body.ten_tep_goc?.trim() || '',
          chu_thich_anh: body.chu_thich_anh?.trim() || '',
          anh_chat_luong_cao_luu_tru: body.anh_chat_luong_cao_luu_tru?.trim() || '/tulieu/goc/',
          ngay_chup: body.ngay_chup?.trim() || '',
          nguon_chup: body.nguon_chup?.trim() || '',
        },
        noi_dung_ban_nhap: {
          nguyen_van_chu_goc: '',
          phien_am: '',
          dich_nghia: '',
          tom_tat_noi_dung: '',
          ghi_chu_trang: '',
        },
        trang_thai_doi_chieu: 'Chưa nhập nội dung',
        nguoi_doi_chieu: '',
        ngay_doi_chieu: '',
      };

      db.trang_ban_goc.push(newPage);
      await writeGiaphaDb(db);
      res.status(201).json({ trang: newPage });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Không thể thêm trang gia phả mới',
      });
    }
  });

  app.put('/api/giapha/pages/:pageId', async (req: Request, res: Response) => {
    try {
      const { pageId } = req.params;
      const body = req.body as Partial<TrangGiaPha> & {
        imageBase64?: string;
        mimeType?: string;
        xac_nhan_doi_chieu?: boolean;
      };

      const db = await readGiaphaDb();
      const idx = db.trang_ban_goc.findIndex((p) => p.id === pageId);
      if (idx === -1) {
        res.status(404).json({ error: `Không tìm thấy trang có mã "${pageId}".` });
        return;
      }

      const current = db.trang_ban_goc[idx];

      if (body.trang_thai_doi_chieu === 'Đã đối chiếu khớp bản gốc') {
        if (!body.xac_nhan_doi_chieu || !body.nguoi_doi_chieu?.trim()) {
          res.status(400).json({
            error:
              'Để đánh dấu "Đã đối chiếu khớp bản gốc", cần nhập tên người đối chiếu và tích chọn xác nhận đã kiểm tra trực tiếp với ảnh gốc.',
          });
          return;
        }
      }

      let nextImagePath = current.anh_ban_goc.duong_dan_anh;
      if (body.imageBase64 && body.mimeType) {
        nextImagePath = await saveUploadedImageFile(
          body.so_trang ?? current.so_trang,
          body.imageBase64,
          body.mimeType
        );
      }

      const updated: TrangGiaPha = {
        ...current,
        so_trang: typeof body.so_trang === 'number' ? body.so_trang : current.so_trang,
        ky_hieu_trang_goc: body.ky_hieu_trang_goc ?? current.ky_hieu_trang_goc,
        tieu_de_trang: body.tieu_de_trang ?? current.tieu_de_trang,
        nhom_noi_dung: body.nhom_noi_dung ?? current.nhom_noi_dung,
        anh_ban_goc: {
          ...current.anh_ban_goc,
          ...(body.anh_ban_goc || {}),
          duong_dan_anh: nextImagePath,
        },
        noi_dung_ban_nhap: {
          ...current.noi_dung_ban_nhap,
          ...(body.noi_dung_ban_nhap || {}),
        },
        trang_thai_doi_chieu: body.trang_thai_doi_chieu ?? current.trang_thai_doi_chieu,
        nguoi_doi_chieu: body.nguoi_doi_chieu ?? current.nguoi_doi_chieu,
        ngay_doi_chieu:
          body.trang_thai_doi_chieu === 'Đã đối chiếu khớp bản gốc'
            ? body.ngay_doi_chieu || new Date().toISOString().slice(0, 10)
            : body.ngay_doi_chieu ?? current.ngay_doi_chieu,
      };

      db.trang_ban_goc[idx] = updated;
      await writeGiaphaDb(db);
      res.json({ trang: updated });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Không thể cập nhật dữ liệu trang',
      });
    }
  });

  app.delete('/api/giapha/pages/:pageId', async (req: Request, res: Response) => {
    try {
      const { pageId } = req.params;
      const db = await readGiaphaDb();
      const exists = db.trang_ban_goc.some((p) => p.id === pageId);
      if (!exists) {
        res.status(404).json({ error: `Không tìm thấy trang "${pageId}".` });
        return;
      }
      db.trang_ban_goc = db.trang_ban_goc.filter((p) => p.id !== pageId);
      db.thanh_vien_pha_he = db.thanh_vien_pha_he.map((m) => ({
        ...m,
        can_cu_trang_ids: m.can_cu_trang_ids.filter((id) => id !== pageId),
      }));
      await writeGiaphaDb(db);
      res.json({ deletedId: pageId, thanh_vien_pha_he: db.thanh_vien_pha_he });
    } catch (err) {
      res.status(500).json({ error: 'Không thể xóa trang', detail: String(err) });
    }
  });

  app.post('/api/giapha/members', async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<ThanhVienPhaHe>;
      if (!body.ho_ten?.trim() || !body.doi_thu || body.doi_thu < 1) {
        res.status(400).json({
          error: 'Cần nhập Họ tên nhân vật (ho_ten) và Đời thứ (>= 1) có căn cứ từ gia phả.',
        });
        return;
      }

      const db = await readGiaphaDb();
      const maxIdNum = db.thanh_vien_pha_he.reduce((max, m) => {
        const n = Number(m.id.replace(/\D/g, '')) || 0;
        return Math.max(max, n);
      }, 0);
      const nextId = `TV-${String(maxIdNum + 1).padStart(3, '0')}`;

      const newMember: ThanhVienPhaHe = {
        id: nextId,
        ho_ten: body.ho_ten.trim(),
        ten_huy_ten_tu: body.ten_huy_ten_tu?.trim() || '',
        doi_thu: Number(body.doi_thu),
        chi_phai: body.chi_phai?.trim() || db.cuon_gia_pha.chi_phai || '',
        gioi_tinh: body.gioi_tinh || 'Chưa rõ',
        cha_id: body.cha_id || null,
        me_id: body.me_id || null,
        ten_vo_chong: body.ten_vo_chong?.trim() || '',
        nam_sinh: body.nam_sinh?.trim() || '',
        nam_mat_hoac_gio: body.nam_mat_hoac_gio?.trim() || '',
        vai_tro_tieu_su: body.vai_tro_tieu_su?.trim() || '',
        can_cu_trang_ids: Array.isArray(body.can_cu_trang_ids) ? body.can_cu_trang_ids : [],
        trang_thai_kiem_chung: body.trang_thai_kiem_chung || 'Đang đối chiếu',
        la_nguoi_con_song: Boolean(body.la_nguoi_con_song),
        an_thong_tin_rieng_tu: Boolean(body.an_thong_tin_rieng_tu),
      };

      db.thanh_vien_pha_he.push(newMember);
      await writeGiaphaDb(db);
      res.status(201).json({ thanh_vien: newMember });
    } catch (err) {
      res.status(500).json({ error: 'Không thể thêm nhân vật phả hệ', detail: String(err) });
    }
  });

  app.put('/api/giapha/members/:memberId', async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const body = req.body as Partial<ThanhVienPhaHe>;
      const db = await readGiaphaDb();
      const idx = db.thanh_vien_pha_he.findIndex((m) => m.id === memberId);
      if (idx === -1) {
        res.status(404).json({ error: `Không tìm thấy nhân vật "${memberId}".` });
        return;
      }
      if (body.cha_id === memberId || body.me_id === memberId) {
        res.status(400).json({ error: 'Không thể chọn chính nhân vật làm cha hoặc mẹ.' });
        return;
      }

      const current = db.thanh_vien_pha_he[idx];
      const updated: ThanhVienPhaHe = {
        ...current,
        ...body,
        id: current.id,
        ho_ten: (body.ho_ten ?? current.ho_ten).trim(),
        doi_thu: Number(body.doi_thu ?? current.doi_thu),
        cha_id: body.cha_id !== undefined ? body.cha_id || null : current.cha_id,
        me_id: body.me_id !== undefined ? body.me_id || null : current.me_id,
        can_cu_trang_ids: Array.isArray(body.can_cu_trang_ids)
          ? body.can_cu_trang_ids
          : current.can_cu_trang_ids,
      };
      db.thanh_vien_pha_he[idx] = updated;
      await writeGiaphaDb(db);
      res.json({ thanh_vien: updated });
    } catch (err) {
      res.status(500).json({ error: 'Không thể cập nhật nhân vật phả hệ', detail: String(err) });
    }
  });

  app.delete('/api/giapha/members/:memberId', async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const db = await readGiaphaDb();
      if (!db.thanh_vien_pha_he.some((m) => m.id === memberId)) {
        res.status(404).json({ error: `Không tìm thấy nhân vật "${memberId}".` });
        return;
      }
      db.thanh_vien_pha_he = db.thanh_vien_pha_he
        .filter((m) => m.id !== memberId)
        .map((m) => ({
          ...m,
          cha_id: m.cha_id === memberId ? null : m.cha_id,
          me_id: m.me_id === memberId ? null : m.me_id,
        }));
      await writeGiaphaDb(db);
      res.json({ deletedId: memberId, thanh_vien_pha_he: db.thanh_vien_pha_he });
    } catch (err) {
      res.status(500).json({ error: 'Không thể xóa nhân vật phả hệ', detail: String(err) });
    }
  });

  app.post('/api/gemini/ocr', async (req: Request, res: Response) => {
    try {
      const { pageId, imageBase64, mimeType, savedImagePath, ghiChuNguCanh } = req.body as {
        pageId?: string;
        imageBase64?: string;
        mimeType?: string;
        savedImagePath?: string;
        ghiChuNguCanh?: string;
      };

      let cleanBase64 = '';
      let finalMime = mimeType || '';

      if (imageBase64 && mimeType) {
        if (mimeType === 'image/svg+xml') {
          res.status(400).json({
            error:
              'Ảnh khung mẫu SVG không phải ảnh chụp trang gia phả thật. Vui lòng chọn ảnh chụp JPG, PNG hoặc WEBP.',
          });
          return;
        }
        cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      } else if (savedImagePath && savedImagePath.startsWith('/tulieu/web/')) {
        const safeRel = path.basename(savedImagePath);
        const diskPath = path.join(WEB_UPLOADS_DIR, safeRel);
        const ext = path.extname(safeRel).toLowerCase();
        if (ext === '.svg') {
          res.status(400).json({
            error: 'Chưa có ảnh chụp trang gia phả thật (JPG/PNG/WEBP) để nhận diện chữ.',
          });
          return;
        }
        const buf = await fs.readFile(diskPath);
        cleanBase64 = buf.toString('base64');
        finalMime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      } else {
        res.status(400).json({
          error:
            'Vui lòng tải lên ảnh chụp trang gia phả thực tế (JPG, PNG, WEBP) để Gemini hỗ trợ nhận diện chữ.',
        });
        return;
      }

      const systemInstruction = `Bạn là chuyên gia hỗ trợ đọc chữ viết tay Hán, Nôm và Quốc ngữ trên trang gia phả Việt Nam.
NGUYÊN TẮC BẮT BUỘC:
1. Chỉ đọc và phiên âm những ký tự thực sự nhìn thấy rõ trong ảnh. Tuyệt đối KHÔNG bịa thêm tên người, năm sinh, năm mất hoặc quan hệ huyết thống không có trên ảnh.
2. Với chữ mờ, rách, viết thảo khó xác định, hãy ghi rõ [khuyết / khó đọc] thay vì đoán bừa.
3. Đề xuất phiên âm (âm Hán Việt / đọc Nôm / Quốc ngữ) và dịch nghĩa tiếng Việt cẩn trọng để người đối chiếu kiểm tra lại.
4. Tất cả kết quả đều chỉ mang tính gợi ý tham khảo và mang trạng thái "Chưa kiểm chứng".`;

      const textPrompt = `Hãy phân tích ảnh trang gia phả ${
        pageId || '[Chưa gắn mã trang]'
      }. ${ghiChuNguCanh ? `Ngữ cảnh người số hóa cung cấp: ${ghiChuNguCanh}` : ''}
Trích xuất các dòng chữ nhìn thấy được, nhận diện hệ chữ, đề xuất phiên âm, dịch nghĩa tiếng Việt và chỉ rõ các chữ khó đọc cần đối chiếu lại với bản gốc.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            { inlineData: { mimeType: finalMime, data: cleanBase64 } },
            { text: textPrompt },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              he_chu_nhan_dien: { type: Type.STRING },
              van_ban_goc_nhan_dien: { type: Type.STRING },
              phien_am_de_xuat: { type: Type.STRING },
              dich_nghia_de_xuat: { type: Type.STRING },
              giai_thich_tu_ngu: { type: Type.STRING },
              ghi_chu_do_tin_cay: { type: Type.STRING },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as Omit<KetQuaOcrGemini, 'trang_thai_kiem_chung'>;

      const result: KetQuaOcrGemini = {
        he_chu_nhan_dien: parsed.he_chu_nhan_dien || 'Chưa xác định rõ hệ chữ',
        van_ban_goc_nhan_dien: parsed.van_ban_goc_nhan_dien || '',
        phien_am_de_xuat: parsed.phien_am_de_xuat || '',
        dich_nghia_de_xuat: parsed.dich_nghia_de_xuat || '',
        giai_thich_tu_ngu: parsed.giai_thich_tu_ngu || '',
        ghi_chu_do_tin_cay:
          parsed.ghi_chu_do_tin_cay ||
          'Kết quả do mô hình AI gợi ý tự động, bắt buộc phải đối chiếu trực tiếp với ảnh trang gốc trước khi lưu chính thức.',
        trang_thai_kiem_chung: 'Chưa kiểm chứng',
      };

      res.json(result);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/gemini/qa', async (req: Request, res: Response) => {
    try {
      const { question } = req.body as { question?: string };
      if (!question || !question.trim()) {
        res.status(400).json({ error: 'Vui lòng nhập câu hỏi cần tra cứu.' });
        return;
      }

      const [db, phamVi] = await Promise.all([readGiaphaDb(), readPhamVi()]);
      const verifiedPages = db.trang_ban_goc.filter(
        (p) => p.trang_thai_doi_chieu === 'Đã đối chiếu khớp bản gốc'
      );
      const verifiedMembers = db.thanh_vien_pha_he.filter(
        (m) => m.trang_thai_kiem_chung === 'Đã đối chiếu trang gốc' && !m.an_thong_tin_rieng_tu
      );

      if (verifiedPages.length === 0 && verifiedMembers.length === 0) {
        const bookName = db.cuon_gia_pha.title
          ? `"${db.cuon_gia_pha.title}"${db.cuon_gia_pha.identifier ? ` (${db.cuon_gia_pha.identifier})` : ''}`
          : 'cuốn gia phả hiện tại';
        res.json({
          cau_tra_loi: `Hiện tại hồ sơ ${bookName} mới ghi nhận thông tin thư mục ban đầu, chưa có trang bản gốc hoặc nhân vật nào ở trạng thái đã đối chiếu khớp bản gốc. Hệ thống không tự suy đoán hay sử dụng dữ liệu ngoài văn bản gốc chưa kiểm chứng để trả lời.`,
          co_du_lieu_xac_minh: false,
          trich_dan: [],
          canh_bao:
            'Vui lòng nạp ảnh trang gốc, nhập nội dung và đánh dấu "Đã đối chiếu khớp bản gốc" tại mục Đối chiếu trước khi sử dụng chức năng hỏi đáp.',
        } satisfies KetQuaHoiDapGemini);
        return;
      }

      const systemInstruction = `Bạn là trợ lý tra cứu nội dung cuốn gia phả số hóa cho đề tài "${phamVi.ten_ung_dung}" (${phamVi.ma_de_tai}).
NGUYÊN TẮC BẮT BUỘC TUYỆT ĐỐI:
1. CHỈ sử dụng thông tin từ các trang đã đánh dấu "Đã đối chiếu khớp bản gốc" và các nhân vật đã đánh dấu "Đã đối chiếu trang gốc" được cung cấp bên dưới.
2. Tuyệt đối KHÔNG suy đoán, không dùng kiến thức bên ngoài về bất kỳ dòng họ nào để bịa đặt tên người, niên đại, chi phái hoặc quan hệ huyết thống.
3. Nếu dữ liệu xác minh không đề cập đến thông tin người dùng hỏi, PHẢI trả lời rõ: "Chưa có trang tư liệu hoặc nhân vật đã đối chiếu khớp bản gốc đề cập đến thông tin này." và đặt co_du_lieu_xac_minh = false.
4. Mọi câu trả lời có dữ liệu phải trích dẫn rõ mã trang (id), số trang (so_trang) và tiêu đề trang.`;

      const prompt = `THÔNG TIN CUỐN GIA PHẢ:\n${JSON.stringify(db.cuon_gia_pha, null, 2)}
\nCÁC TRANG ĐÃ ĐỐI CHIẾU KHỚP BẢN GỐC:\n${JSON.stringify(verifiedPages, null, 2)}
\nCÁC NHÂN VẬT ĐÃ ĐỐI CHIẾU TRANG GỐC:\n${JSON.stringify(verifiedMembers, null, 2)}
\nCÂU HỎI CỦA NGƯỜI DÙNG:\n${question.trim()}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cau_tra_loi: { type: Type.STRING },
              co_du_lieu_xac_minh: { type: Type.BOOLEAN },
              trich_dan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ma_trang: { type: Type.STRING },
                    so_trang: { type: Type.INTEGER },
                    tieu_de: { type: Type.STRING },
                    trang_thai_doi_chieu: { type: Type.STRING },
                  },
                },
              },
              canh_bao: { type: Type.STRING },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as KetQuaHoiDapGemini;
      res.json({
        cau_tra_loi:
          parsed.cau_tra_loi ||
          'Chưa có trang tư liệu hoặc nhân vật đã đối chiếu khớp bản gốc đề cập đến thông tin này.',
        co_du_lieu_xac_minh: Boolean(parsed.co_du_lieu_xac_minh),
        trich_dan: Array.isArray(parsed.trich_dan) ? parsed.trich_dan : [],
        canh_bao: parsed.canh_bao || '',
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gia Phả Số – Cội Nguồn Việt server đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

createApp();
