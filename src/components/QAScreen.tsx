import { useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowRight, BookMarked, Send, ShieldAlert } from 'lucide-react';
import type { CoSoDuLieuGiaPha, KetQuaHoiDapGemini, ScreenId } from '../types/giapha';

interface QAScreenProps {
  duLieu: CoSoDuLieuGiaPha;
  onOpenComparison: (pageId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

interface QAHistoryItem {
  id: string;
  question: string;
  answer?: KetQuaHoiDapGemini;
  error?: string;
}

export function QAScreen({ duLieu, onOpenComparison, onNavigate }: QAScreenProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAHistoryItem[]>([]);

  const book = duLieu.cuon_gia_pha;
  const bookLabel = book.title
    ? `${book.title}${book.identifier ? ` (${book.identifier})` : ''}`
    : 'cuốn gia phả hiện tại';

  const sampleQuestions = [
    `Hiện ${bookLabel} đã có trang bản gốc nào được đánh dấu đối chiếu khớp bản gốc chưa?`,
    `Trong cây phả hệ của ${book.ten_dong_ho || 'dòng họ'} đã có nhân vật nào được kiểm chứng từ trang gốc chưa?`,
    `Những thông tin nào của ${bookLabel} còn thiếu ảnh chụp hoặc cần đối chiếu trực tiếp?`,
  ];

  const verifiedPagesCount = duLieu.trang_ban_goc.filter(
    (p) => p.trang_thai_doi_chieu === 'Đã đối chiếu khớp bản gốc'
  ).length;
  const verifiedMembersCount = duLieu.thanh_vien_pha_he.filter(
    (m) => m.trang_thai_kiem_chung === 'Đã đối chiếu trang gốc' && !m.an_thong_tin_rieng_tu
  ).length;

  const submitQuestion = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean || loading) return;

    const itemId = String(Date.now());
    setHistory((prev) => [{ id: itemId, question: clean }, ...prev]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHistory((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, error: data.error || 'Không thể truy vấn câu trả lời từ Gemini.' }
              : item
          )
        );
        return;
      }

      setHistory((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, answer: data as KetQuaHoiDapGemini } : item
        )
      );
    } catch {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, error: 'Lỗi kết nối máy chủ khi gọi chức năng hỏi đáp tư liệu.' }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitQuestion(question);
  };

  return (
    <div className="pt-8 space-y-8">
      <div className="border-b border-[#E5DFD3] pb-6 space-y-2">
        <p className="text-xs font-medium uppercase text-[#9A3412]">
          Trợ lý tra cứu nội dung cuốn gia phả đã đối chiếu
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
          Hỏi đáp tư liệu gia phả với Gemini
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
          Phạm vi tra cứu hiện tại: <strong className="text-stone-900">{bookLabel}</strong>. Hệ thống chỉ trả lời dựa trên các trang đã xác nhận <strong>Đã đối chiếu khớp bản gốc</strong> ({verifiedPagesCount} trang) và nhân vật đã kiểm chứng ({verifiedMembersCount} nhân vật) trong{' '}
          <code className="font-mono text-xs bg-[#F3EFE7] px-1.5 py-0.5 rounded">giapha.json</code>.
        </p>
      </div>

      <div className="p-4 bg-[#F3EFE7] border border-[#D6CEBE] rounded-lg flex items-start gap-3 text-xs sm:text-sm text-stone-800">
        <ShieldAlert className="w-5 h-5 text-[#9A3412] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-stone-900">
            Nguyên tắc trả lời trung thực, không suy đoán
          </p>
          <p className="text-stone-700 leading-relaxed">
            Khi cuốn gia phả chưa có trang hoặc nhân vật nào được đối chiếu khớp bản gốc, hệ thống sẽ từ chối suy đoán và nhắc bạn hoàn tất bước đối chiếu thay vì bịa đặt dữ liệu dòng họ.
          </p>
        </div>
      </div>

      <section className="bg-white border border-[#E5DFD3] rounded-lg p-5 sm:p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="qa-input" className="block text-sm font-semibold text-stone-900">
            Đặt câu hỏi về nội dung cuốn gia phả đang số hóa
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="qa-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nhập câu hỏi cần tra cứu từ các trang đã đối chiếu..."
              className="flex-1 px-4 py-3 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-stone-900 focus:outline-none focus:border-[#9A3412] min-h-[44px]"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{loading ? 'Đang tra cứu...' : 'Gửi câu hỏi'}</span>
            </button>
          </div>
        </form>

        <div className="pt-2 space-y-2">
          <p className="text-xs font-medium text-stone-500">Câu hỏi gợi ý kiểm tra dữ liệu thực tế:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submitQuestion(q)}
                disabled={loading}
                className="text-left px-3 py-2 text-xs font-medium text-stone-800 bg-[#FBF9F5] hover:bg-[#F3EFE7] border border-[#D6CEBE] rounded-md transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Kết quả hỏi đáp" className="space-y-6">
        {history.length === 0 ? (
          <div className="p-8 bg-white border border-[#E5DFD3] rounded-lg text-center space-y-3">
            <BookMarked className="w-8 h-8 text-stone-400 mx-auto" aria-hidden="true" />
            <p className="font-serif text-lg font-semibold text-stone-900">
              Chưa có câu hỏi nào trong phiên tra cứu này
            </p>
            <p className="text-sm text-stone-600">
              Nếu bạn chưa nạp trang hoặc đối chiếu khớp bản gốc, hãy bắt đầu tại{' '}
              <button
                type="button"
                onClick={() => onNavigate('trang-tu-lieu')}
                className="font-semibold text-[#9A3412] underline cursor-pointer"
              >
                Trang gốc
              </button>
              .
            </p>
          </div>
        ) : (
          history.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-[#E5DFD3] rounded-lg p-5 sm:p-6 space-y-4"
            >
              <div className="border-b border-[#E5DFD3] pb-3">
                <p className="text-xs uppercase text-stone-500">Câu hỏi tra cứu</p>
                <h2 className="mt-1 font-serif text-lg font-semibold text-stone-900">
                  {item.question}
                </h2>
              </div>

              {!item.answer && !item.error && (
                <p className="text-sm text-stone-600">Đang đối chiếu dữ liệu đã xác minh...</p>
              )}

              {item.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                  {item.error}
                </div>
              )}

              {item.answer && (
                <div className="space-y-4">
                  {!item.answer.co_du_lieu_xac_minh && (
                    <div className="p-3 bg-[#FEF3C7]/60 border border-[#D97706]/40 rounded flex items-start gap-2.5 text-xs text-[#92400E]">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        Chưa có trang bản gốc hoặc nhân vật đã đối chiếu khớp bản gốc để xác nhận thông tin này.
                      </span>
                    </div>
                  )}

                  <div className="text-sm sm:text-base text-stone-800 leading-relaxed whitespace-pre-wrap">
                    {item.answer.cau_tra_loi}
                  </div>

                  {item.answer.canh_bao && (
                    <p className="text-xs text-[#92400E] bg-[#FEF3C7]/30 p-3 rounded border border-[#D97706]/30">
                      <strong>Lưu ý:</strong> {item.answer.canh_bao}
                    </p>
                  )}

                  {item.answer.trich_dan.length > 0 && (
                    <div className="pt-3 border-t border-[#E5DFD3] space-y-2.5">
                      <p className="text-xs font-semibold uppercase text-stone-500">
                        Trang bản gốc trích dẫn từ giapha.json
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.answer.trich_dan.map((cit, idx) => (
                          <div
                            key={`${cit.ma_trang}-${idx}`}
                            className="p-3.5 bg-[#FBF9F5] border border-[#E5DFD3] rounded-md flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1 text-xs">
                              <p className="font-mono font-semibold text-stone-900 tabular-nums">
                                {cit.ma_trang} · Trang {cit.so_trang}
                              </p>
                              <p className="font-medium text-stone-800">{cit.tieu_de}</p>
                              <p className="text-stone-500">
                                Tình trạng: {cit.trang_thai_doi_chieu}
                              </p>
                            </div>
                            {cit.ma_trang && (
                              <button
                                type="button"
                                onClick={() => onOpenComparison(cit.ma_trang)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A3412] hover:text-[#7C2D12] shrink-0 cursor-pointer"
                              >
                                <span>Đối chiếu</span>
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
