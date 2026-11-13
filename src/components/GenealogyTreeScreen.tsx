import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {
  ArrowRight,
  Edit3,
  GitFork,
  Lock,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  CoSoDuLieuGiaPha,
  ScreenId,
  ThanhVienPhaHe,
  TrangThaiKiemChungThanhVien,
} from '../types/giapha';
import { MemberVerifyInline } from './VerificationLabel';

interface GenealogyTreeScreenProps {
  duLieu: CoSoDuLieuGiaPha;
  onMemberSaved: (member: ThanhVienPhaHe) => void;
  onMembersReplaced: (members: ThanhVienPhaHe[]) => void;
  onOpenComparison: (pageId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

interface EdgePath {
  id: string;
  d: string;
  highlighted: boolean;
  dimmed: boolean;
}

const MEMBER_VERIFY_STATES: TrangThaiKiemChungThanhVien[] = [
  'Chưa kiểm chứng',
  'Đang đối chiếu',
  'Đã đối chiếu trang gốc',
];

export function GenealogyTreeScreen({
  duLieu,
  onMemberSaved,
  onMembersReplaced,
  onOpenComparison,
  onNavigate,
}: GenealogyTreeScreenProps) {
  const members = duLieu.thanh_vien_pha_he;
  const pages = duLieu.trang_ban_goc;

  const [searchKeyword, setSearchKeyword] = useState('');
  const [branchFilter, setBranchFilter] = useState('Tất cả');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<0.85 | 1 | 1.15>(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoTen, setHoTen] = useState('');
  const [tenHuy, setTenHuy] = useState('');
  const [doiThu, setDoiThu] = useState(1);
  const [chiPhai, setChiPhai] = useState('');
  const [gioiTinh, setGioiTinh] = useState<'Nam' | 'Nữ' | 'Chưa rõ'>('Chưa rõ');
  const [chaId, setChaId] = useState<string>('');
  const [meId, setMeId] = useState<string>('');
  const [tenVoChong, setTenVoChong] = useState('');
  const [namSinh, setNamSinh] = useState('');
  const [namMat, setNamMat] = useState('');
  const [vaiTroTieuSu, setVaiTroTieuSu] = useState('');
  const [canCuTrangIds, setCanCuTrangIds] = useState<string[]>([]);
  const [trangThaiKiemChung, setTrangThaiKiemChung] =
    useState<TrangThaiKiemChungThanhVien>('Đang đối chiếu');
  const [laNguoiConSong, setLaNguoiConSong] = useState(false);
  const [anThongTinRiengTu, setAnThongTinRiengTu] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [edges, setEdges] = useState<EdgePath[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const branches = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.chi_phai.trim()) set.add(m.chi_phai.trim());
    });
    return Array.from(set);
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    return members.filter((m) => {
      if (branchFilter !== 'Tất cả' && m.chi_phai.trim() !== branchFilter) return false;
      if (!q) return true;
      const displayName = m.an_thong_tin_rieng_tu ? 'ẩn thông tin riêng tư' : m.ho_ten.toLowerCase();
      return (
        displayName.includes(q) ||
        m.ten_huy_ten_tu.toLowerCase().includes(q) ||
        m.chi_phai.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    });
  }, [members, branchFilter, searchKeyword]);

  const generationTiers = useMemo(() => {
    const map = new Map<number, ThanhVienPhaHe[]>();
    filteredMembers.forEach((m) => {
      const list = map.get(m.doi_thu) || [];
      list.push(m);
      map.set(m.doi_thu, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredMembers]);

  const lineageSet = useMemo(() => {
    const set = new Set<string>();
    if (!selectedMemberId) return set;
    set.add(selectedMemberId);
    const byId = new Map(members.map((m) => [m.id, m]));

    // Ancestors
    const queueUp = [selectedMemberId];
    while (queueUp.length > 0) {
      const curId = queueUp.shift()!;
      const cur = byId.get(curId);
      if (!cur) continue;
      if (cur.cha_id && !set.has(cur.cha_id)) {
        set.add(cur.cha_id);
        queueUp.push(cur.cha_id);
      }
      if (cur.me_id && !set.has(cur.me_id)) {
        set.add(cur.me_id);
        queueUp.push(cur.me_id);
      }
    }

    // Descendants
    const queueDown = [selectedMemberId];
    while (queueDown.length > 0) {
      const curId = queueDown.shift()!;
      members.forEach((m) => {
        if ((m.cha_id === curId || m.me_id === curId) && !set.has(m.id)) {
          set.add(m.id);
          queueDown.push(m.id);
        }
      });
    }
    return set;
  }, [members, selectedMemberId]);

  const computeEdges = useCallback(() => {
    const container = canvasRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const scale = zoomScale;

    const nextEdges: EdgePath[] = [];
    filteredMembers.forEach((child) => {
      const childEl = nodeRefs.current[child.id];
      if (!childEl) return;
      const cRect = childEl.getBoundingClientRect();
      const x2 = (cRect.left - containerRect.left + cRect.width / 2) / scale;
      const y2 = (cRect.top - containerRect.top) / scale;

      const parentIds = [child.cha_id, child.me_id].filter(
        (pid): pid is string => Boolean(pid)
      );

      parentIds.forEach((pid) => {
        const parentEl = nodeRefs.current[pid];
        if (!parentEl) return;
        const pRect = parentEl.getBoundingClientRect();
        const x1 = (pRect.left - containerRect.left + pRect.width / 2) / scale;
        const y1 = (pRect.bottom - containerRect.top) / scale;
        const midY = (y1 + y2) / 2;
        const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        const highlighted =
          Boolean(selectedMemberId) &&
          lineageSet.has(pid) &&
          lineageSet.has(child.id);
        const dimmed = Boolean(selectedMemberId) && !highlighted;

        nextEdges.push({
          id: `${pid}->${child.id}`,
          d,
          highlighted,
          dimmed,
        });
      });
    });

    setSvgSize({
      width: container.scrollWidth,
      height: container.scrollHeight,
    });
    setEdges(nextEdges);
  }, [filteredMembers, lineageSet, selectedMemberId, zoomScale]);

  useLayoutEffect(() => {
    computeEdges();
    const container = canvasRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => computeEdges());
    ro.observe(container);
    window.addEventListener('resize', computeEdges);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeEdges);
    };
  }, [computeEdges]);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || null;

  const openCreateForm = () => {
    setEditingId(null);
    setHoTen('');
    setTenHuy('');
    setDoiThu(1);
    setChiPhai(duLieu.cuon_gia_pha.chi_phai || '');
    setGioiTinh('Chưa rõ');
    setChaId('');
    setMeId('');
    setTenVoChong('');
    setNamSinh('');
    setNamMat('');
    setVaiTroTieuSu('');
    setCanCuTrangIds([]);
    setTrangThaiKiemChung('Đang đối chiếu');
    setLaNguoiConSong(false);
    setAnThongTinRiengTu(false);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (m: ThanhVienPhaHe) => {
    setEditingId(m.id);
    setHoTen(m.ho_ten);
    setTenHuy(m.ten_huy_ten_tu);
    setDoiThu(m.doi_thu);
    setChiPhai(m.chi_phai);
    setGioiTinh(m.gioi_tinh);
    setChaId(m.cha_id || '');
    setMeId(m.me_id || '');
    setTenVoChong(m.ten_vo_chong);
    setNamSinh(m.nam_sinh);
    setNamMat(m.nam_mat_hoac_gio);
    setVaiTroTieuSu(m.vai_tro_tieu_su);
    setCanCuTrangIds(m.can_cu_trang_ids);
    setTrangThaiKiemChung(m.trang_thai_kiem_chung);
    setLaNguoiConSong(m.la_nguoi_con_song);
    setAnThongTinRiengTu(m.an_thong_tin_rieng_tu);
    setFormError('');
    setFormOpen(true);
  };

  const toggleEvidencePage = (pageId: string) => {
    setCanCuTrangIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    );
  };

  const handleSaveMember = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError('');

    const payload = {
      ho_ten: hoTen.trim(),
      ten_huy_ten_tu: tenHuy.trim(),
      doi_thu: Number(doiThu),
      chi_phai: chiPhai.trim(),
      gioi_tinh: gioiTinh,
      cha_id: chaId || null,
      me_id: meId || null,
      ten_vo_chong: tenVoChong.trim(),
      nam_sinh: namSinh.trim(),
      nam_mat_hoac_gio: namMat.trim(),
      vai_tro_tieu_su: vaiTroTieuSu.trim(),
      can_cu_trang_ids: canCuTrangIds,
      trang_thai_kiem_chung: trangThaiKiemChung,
      la_nguoi_con_song: laNguoiConSong,
      an_thong_tin_rieng_tu: anThongTinRiengTu,
    };

    try {
      const url = editingId
        ? `/api/giapha/members/${encodeURIComponent(editingId)}`
        : '/api/giapha/members';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Không thể lưu thông tin nhân vật phả hệ.');
        return;
      }
      const saved = data.thanh_vien as ThanhVienPhaHe;
      onMemberSaved(saved);
      setSelectedMemberId(saved.id);
      setFormOpen(false);
    } catch {
      setFormError('Lỗi kết nối máy chủ khi lưu nhân vật phả hệ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/giapha/members/${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        onMembersReplaced(data.thanh_vien_pha_he as ThanhVienPhaHe[]);
        if (selectedMemberId === memberId) setSelectedMemberId(null);
        setConfirmDeleteId(null);
      }
    } catch {
      // ignore transient
    }
  };

  const verifiedMembersCount = members.filter(
    (m) => m.trang_thai_kiem_chung === 'Đã đối chiếu trang gốc'
  ).length;
  const maxGen = members.reduce((m, cur) => Math.max(m, cur.doi_thu), 0);

  return (
    <div className="pt-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E5DFD3] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-[#9A3412]">
            Chức năng lõi 3 — Sơ đồ cây phả hệ từ thông tin có căn cứ
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
            Sơ đồ cây phả hệ &amp; Quản lý thế hệ
          </h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
            Cây phả hệ chỉ lập từ tên người, đời thứ và quan hệ cha – mẹ – con ghi nhận rõ trên trang gia phả gốc. Mọi nhân vật phải gắn căn cứ trang tương ứng và tuân thủ bảo mật người còn sống.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-md whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
        >
          <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Thêm nhân vật phả hệ</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 border border-[#E5DFD3] rounded-lg bg-[#F3EFE7]/50 divide-x divide-[#E5DFD3]">
        <div className="p-4">
          <p className="font-serif text-2xl font-semibold text-stone-900 tabular-nums">
            {members.length}
          </p>
          <p className="text-xs text-stone-600 mt-0.5">Nhân vật đã ghi nhận</p>
        </div>
        <div className="p-4">
          <p className="font-serif text-2xl font-semibold text-stone-900 tabular-nums">
            {maxGen}
          </p>
          <p className="text-xs text-stone-600 mt-0.5">Số đời trong phả hệ</p>
        </div>
        <div className="p-4">
          <p className="font-serif text-2xl font-semibold text-[#14532D] tabular-nums">
            {verifiedMembersCount}
          </p>
          <p className="text-xs text-stone-600 mt-0.5">Đã đối chiếu trang gốc</p>
        </div>
      </div>

      {/* Add / Edit Member Modal-inline Form */}
      {formOpen && (
        <form
          onSubmit={handleSaveMember}
          className="bg-white border border-[#D6CEBE] rounded-lg p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <h2 className="font-serif text-xl font-semibold text-stone-900">
              {editingId ? `Cập nhật nhân vật ${editingId}` : 'Thêm nhân vật vào cây phả hệ'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="m-name" className="block text-xs font-semibold text-stone-700 mb-1">
                Họ tên trên gia phả <span className="text-[#9A3412]">*</span>
              </label>
              <input
                id="m-name"
                type="text"
                required
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                placeholder="Ghi đúng tên chép trong gia phả..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="m-alias" className="block text-xs font-semibold text-stone-700 mb-1">
                Tên húy / tên tự / thụy hiệu
              </label>
              <input
                id="m-alias"
                type="text"
                value={tenHuy}
                onChange={(e) => setTenHuy(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="m-gen" className="block text-xs font-semibold text-stone-700 mb-1">
                Đời thứ <span className="text-[#9A3412]">*</span>
              </label>
              <input
                id="m-gen"
                type="number"
                min={1}
                required
                value={doiThu}
                onChange={(e) => setDoiThu(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="m-gender" className="block text-xs font-semibold text-stone-700 mb-1">
                Giới tính
              </label>
              <select
                id="m-gender"
                value={gioiTinh}
                onChange={(e) => setGioiTinh(e.target.value as 'Nam' | 'Nữ' | 'Chưa rõ')}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Chưa rõ">Chưa rõ</option>
              </select>
            </div>

            <div>
              <label htmlFor="m-branch" className="block text-xs font-semibold text-stone-700 mb-1">
                Chi phái
              </label>
              <input
                id="m-branch"
                type="text"
                value={chiPhai}
                onChange={(e) => setChiPhai(e.target.value)}
                placeholder="VD: Chi trưởng, Phái nhì..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="m-father" className="block text-xs font-semibold text-stone-700 mb-1">
                Cha (trong cây phả hệ)
              </label>
              <select
                id="m-father"
                value={chaId}
                onChange={(e) => setChaId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              >
                <option value="">-- Chưa xác định / Thủy tổ --</option>
                {members
                  .filter((m) => m.id !== editingId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.ho_ten} (Đời {m.doi_thu} · {m.id})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="m-mother" className="block text-xs font-semibold text-stone-700 mb-1">
                Mẹ (trong cây phả hệ)
              </label>
              <select
                id="m-mother"
                value={meId}
                onChange={(e) => setMeId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              >
                <option value="">-- Chưa xác định --</option>
                {members
                  .filter((m) => m.id !== editingId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.ho_ten} (Đời {m.doi_thu} · {m.id})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="m-spouse" className="block text-xs font-semibold text-stone-700 mb-1">
                Phối ngẫu (vợ / chồng)
              </label>
              <input
                id="m-spouse"
                type="text"
                value={tenVoChong}
                onChange={(e) => setTenVoChong(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="m-birth" className="block text-xs font-semibold text-stone-700 mb-1">
                Năm sinh / Niên hiệu
              </label>
              <input
                id="m-birth"
                type="text"
                value={namSinh}
                onChange={(e) => setNamSinh(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="m-death" className="block text-xs font-semibold text-stone-700 mb-1">
                Năm mất / Ngày giỗ
              </label>
              <input
                id="m-death"
                type="text"
                value={namMat}
                onChange={(e) => setNamMat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              />
            </div>

            <div>
              <label htmlFor="m-verify" className="block text-xs font-semibold text-stone-700 mb-1">
                Tình trạng kiểm chứng
              </label>
              <select
                id="m-verify"
                value={trangThaiKiemChung}
                onChange={(e) =>
                  setTrangThaiKiemChung(e.target.value as TrangThaiKiemChungThanhVien)
                }
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
              >
                {MEMBER_VERIFY_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="m-bio" className="block text-xs font-semibold text-stone-700 mb-1">
              Vai trò / Tiểu sử trích dẫn từ gia phả
            </label>
            <textarea
              id="m-bio"
              rows={2}
              value={vaiTroTieuSu}
              onChange={(e) => setVaiTroTieuSu(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md"
            />
          </div>

          {/* Evidence Page Checkboxes */}
          <div className="p-4 bg-[#FBF9F5] border border-[#E5DFD3] rounded-md space-y-2">
            <p className="text-xs font-semibold text-stone-800">
              Căn cứ trang bản gốc ghi nhận nhân vật này
            </p>
            {pages.length === 0 ? (
              <p className="text-xs text-stone-500">
                Chưa có trang nào trong giapha.json. Bạn vẫn có thể lưu nhân vật và bổ sung trang căn cứ sau.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {pages.map((p) => (
                  <label
                    key={p.id}
                    className="inline-flex items-center gap-2 text-xs text-stone-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={canCuTrangIds.includes(p.id)}
                      onChange={() => toggleEvidencePage(p.id)}
                      className="accent-[#9A3412]"
                    />
                    <span>
                      Trang {p.so_trang} ({p.id})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Switches */}
          <div className="flex flex-wrap gap-6 text-xs text-stone-800">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={laNguoiConSong}
                onChange={(e) => setLaNguoiConSong(e.target.checked)}
                className="accent-[#9A3412]"
              />
              <span>Là người còn sống</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anThongTinRiengTu}
                onChange={(e) => setAnThongTinRiengTu(e.target.checked)}
                className="accent-[#9A3412]"
              />
              <span>Ẩn thông tin cá nhân riêng tư khi công khai</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E5DFD3]">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-[#D6CEBE] rounded-md cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-md cursor-pointer"
            >
              {saving ? 'Đang lưu...' : editingId ? 'Lưu cập nhật' : 'Lưu vào cây phả hệ'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Zoom Bar */}
      {members.length > 0 && (
        <section className="bg-white border border-[#E5DFD3] rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search
                className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm nhân vật trong cây phả hệ..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[38px]"
              />
            </div>

            {branches.length > 0 && (
              <select
                aria-label="Lọc theo chi phái"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-md min-h-[38px]"
              >
                <option value="Tất cả">Tất cả chi phái</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setZoomScale(0.85)}
              className={`p-1.5 rounded border cursor-pointer ${
                zoomScale === 0.85 ? 'bg-[#9A3412] text-white border-[#9A3412]' : 'bg-white border-[#D6CEBE]'
              }`}
              title="Thu nhỏ 85%"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className={`px-2 py-1 rounded border font-mono cursor-pointer ${
                zoomScale === 1 ? 'bg-[#9A3412] text-white border-[#9A3412]' : 'bg-white border-[#D6CEBE]'
              }`}
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1.15)}
              className={`p-1.5 rounded border cursor-pointer ${
                zoomScale === 1.15 ? 'bg-[#9A3412] text-white border-[#9A3412]' : 'bg-white border-[#D6CEBE]'
              }`}
              title="Phóng to 115%"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            {selectedMemberId && (
              <button
                type="button"
                onClick={() => setSelectedMemberId(null)}
                className="ml-2 px-2.5 py-1 bg-[#F3EFE7] border border-[#D6CEBE] rounded text-stone-800 cursor-pointer"
              >
                Bỏ chọn nhánh
              </button>
            )}
          </div>
        </section>
      )}

      {members.length > 0 && verifiedMembersCount < members.length && (
        <div className="p-4 bg-[#F3EFE7] border border-[#D6CEBE] rounded-lg text-xs sm:text-sm text-stone-700 leading-relaxed">
          <strong className="text-stone-900">Lưu ý kiểm chứng:</strong> Có{' '}
          <span className="font-semibold tabular-nums">{members.length - verifiedMembersCount}</span> nhân vật trong sơ đồ hiện ở trạng thái{' '}
          <span className="font-semibold text-[#92400E]">Đang đối chiếu</span> (tổng hợp từ thông tin thư mục dẫn lại về cuốn{' '}
          <strong className="text-stone-900">{duLieu.cuon_gia_pha.title || 'gia phả'}</strong>). Nhấp vào từng thẻ để xem trang căn cứ và cập nhật khi có ảnh chụp trực tiếp văn bản gốc.
        </div>
      )}

      {/* Main Tree Canvas OR Honest Empty State */}
      {members.length === 0 ? (
        <div className="bg-white border border-[#E5DFD3] rounded-lg p-8 sm:p-12 text-center space-y-4">
          <GitFork className="w-10 h-10 text-stone-400 mx-auto" aria-hidden="true" />
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Chưa có dữ liệu nhân vật nào để dựng cây phả hệ
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Hệ thống không tự tạo thủy tổ hay quan hệ huyết thống giả. Hãy nạp và đối chiếu nội dung trang gia phả gốc trước, sau đó nhấn{' '}
              <strong>&ldquo;Thêm nhân vật phả hệ&rdquo;</strong> để dựng sơ đồ cây theo từng đời.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('trang-tu-lieu')}
              className="px-4 py-2 text-xs font-semibold text-stone-900 bg-[#F3EFE7] border border-[#D6CEBE] rounded-md cursor-pointer"
            >
              Xem ảnh trang gốc
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-md cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Thêm nhân vật đầu tiên</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Tree Board */}
          <div
            className={`${
              selectedMember ? 'lg:col-span-8' : 'lg:col-span-12'
            } bg-white border border-[#E5DFD3] rounded-lg overflow-auto p-6`}
          >
            <div
              ref={canvasRef}
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top left',
              }}
              className="relative min-w-[640px] space-y-12 py-2"
            >
              {/* SVG Connector Overlay */}
              <svg
                aria-hidden="true"
                width={svgSize.width}
                height={svgSize.height}
                className="absolute inset-0 pointer-events-none"
              >
                {edges.map((edge) => (
                  <path
                    key={edge.id}
                    d={edge.d}
                    fill="none"
                    stroke={edge.highlighted ? '#9A3412' : '#C8BEB0'}
                    strokeWidth={edge.highlighted ? 2.4 : 1.5}
                    strokeOpacity={edge.dimmed ? 0.25 : 1}
                  />
                ))}
              </svg>

              {generationTiers.map(([gen, list]) => (
                <div key={gen} className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold uppercase text-[#9A3412] tabular-nums">
                      Đời thứ {gen}
                    </span>
                    <div className="flex-1 h-px bg-[#E5DFD3]" />
                  </div>

                  <div className="flex flex-wrap justify-center gap-5">
                    {list.map((m) => {
                      const isSelected = selectedMemberId === m.id;
                      const isDimmed =
                        Boolean(selectedMemberId) && !lineageSet.has(m.id);
                      const displayName = m.an_thong_tin_rieng_tu
                        ? '[Ẩn thông tin cá nhân]'
                        : m.ho_ten;

                      return (
                        <button
                          key={m.id}
                          ref={(el) => {
                            nodeRefs.current[m.id] = el;
                          }}
                          type="button"
                          onClick={() =>
                            setSelectedMemberId((prev) => (prev === m.id ? null : m.id))
                          }
                          className={`w-56 text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#F3EFE7] border-[#9A3412] ring-1 ring-[#9A3412]'
                              : 'bg-[#FBF9F5] border-[#D6CEBE] hover:border-[#9A3412]/60'
                          } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-stone-500 tabular-nums">
                            <span>{m.id}</span>
                            <span>{m.gioi_tinh}</span>
                          </div>
                          <p className="mt-1 font-serif text-base font-semibold text-stone-900 leading-snug">
                            {displayName}
                          </p>
                          {m.ten_huy_ten_tu && !m.an_thong_tin_rieng_tu && (
                            <p className="text-xs text-stone-600 mt-0.5">
                              Tự/Húy: {m.ten_huy_ten_tu}
                            </p>
                          )}
                          {(m.nam_sinh || m.nam_mat_hoac_gio) && !m.an_thong_tin_rieng_tu && (
                            <p className="text-[11px] text-stone-500 mt-1 tabular-nums">
                              {[m.nam_sinh, m.nam_mat_hoac_gio].filter(Boolean).join(' – ')}
                            </p>
                          )}
                          <div className="mt-2 pt-2 border-t border-[#E5DFD3] flex items-center justify-between gap-2">
                            <MemberVerifyInline status={m.trang_thai_kiem_chung} />
                            {m.an_thong_tin_rieng_tu && (
                              <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" aria-hidden="true" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Member Inspector */}
          {selectedMember && (
            <aside className="lg:col-span-4 bg-white border border-[#E5DFD3] rounded-lg p-5 space-y-4 lg:sticky lg:top-20">
              <div className="flex items-start justify-between gap-2 border-b border-[#E5DFD3] pb-3">
                <div>
                  <p className="text-xs font-mono text-stone-500 tabular-nums">
                    {selectedMember.id} · Đời thứ {selectedMember.doi_thu}
                  </p>
                  <h2 className="font-serif text-xl font-semibold text-stone-900 mt-0.5">
                    {selectedMember.an_thong_tin_rieng_tu
                      ? '[Ẩn thông tin riêng tư]'
                      : selectedMember.ho_ten}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMemberId(null)}
                  className="p-1 text-stone-400 hover:text-stone-800 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <MemberVerifyInline status={selectedMember.trang_thai_kiem_chung} />

              <dl className="divide-y divide-[#E5DFD3] text-xs">
                <div className="py-2 flex justify-between gap-3">
                  <dt className="text-stone-500">Chi phái</dt>
                  <dd className="font-medium text-stone-900 text-right">
                    {selectedMember.chi_phai || 'Chưa ghi rõ'}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-3">
                  <dt className="text-stone-500">Cha / Mẹ</dt>
                  <dd className="font-medium text-stone-900 text-right">
                    {[
                      members.find((x) => x.id === selectedMember.cha_id)?.ho_ten,
                      members.find((x) => x.id === selectedMember.me_id)?.ho_ten,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Chưa liên kết'}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-3">
                  <dt className="text-stone-500">Phối ngẫu</dt>
                  <dd className="font-medium text-stone-900 text-right">
                    {selectedMember.ten_vo_chong || 'Chưa ghi nhận'}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-3">
                  <dt className="text-stone-500">Năm sinh – mất / giỗ</dt>
                  <dd className="font-medium text-stone-900 text-right tabular-nums">
                    {selectedMember.an_thong_tin_rieng_tu
                      ? '[Ẩn theo quy định riêng tư]'
                      : [selectedMember.nam_sinh, selectedMember.nam_mat_hoac_gio]
                          .filter(Boolean)
                          .join(' – ') || 'Chưa rõ'}
                  </dd>
                </div>
              </dl>

              {selectedMember.vai_tro_tieu_su && !selectedMember.an_thong_tin_rieng_tu && (
                <div className="text-xs text-stone-700 leading-relaxed bg-[#FBF9F5] p-3 rounded border border-[#E5DFD3]">
                  {selectedMember.vai_tro_tieu_su}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[#E5DFD3]">
                <p className="text-xs font-semibold text-stone-800">
                  Trang gốc làm căn cứ:
                </p>
                {selectedMember.can_cu_trang_ids.length === 0 ? (
                  <p className="text-xs text-stone-500">Chưa gắn trang căn cứ.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.can_cu_trang_ids.map((pid) => (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => onOpenComparison(pid)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold text-[#9A3412] bg-[#F3EFE7] border border-[#D6CEBE] rounded hover:bg-[#E5DFD3] cursor-pointer"
                      >
                        <span>{pid}</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(selectedMember)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-900 bg-[#F3EFE7] hover:bg-[#E5DFD3] border border-[#D6CEBE] rounded-md cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Chỉnh sửa</span>
                </button>

                {confirmDeleteId === selectedMember.id ? (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(selectedMember.id)}
                      className="font-semibold text-red-700 hover:text-red-900 cursor-pointer"
                    >
                      Xác nhận xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-stone-500 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(selectedMember.id)}
                    className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Xóa nhân vật</span>
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
