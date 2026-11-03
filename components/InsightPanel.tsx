'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { viTerm } from '@/lib/i18n/vi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: 'Mệnh cách' },
  { key: 'love',        label: 'Tình cảm' },
  { key: 'career',      label: 'Sự nghiệp' },
  { key: 'wealth',      label: 'Tài lộc' },
  { key: 'health',      label: 'Sức khỏe' },
  { key: 'personality', label: 'Tính cách' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Tóm tắt lá số của tôi theo 3 phần:

## Tóm lại
## Điểm mạnh
## Cần lưu ý`,

  love: `Xem chuyện tình cảm, hôn nhân của tôi theo 3 phần:

## Tóm lại
## 10 năm hiện tại
## Lời khuyên`,

  career: `Xem công việc, sự nghiệp của tôi theo 3 phần (hợp làm công hay tự kinh doanh, ngành nghề hợp):

## Tóm lại
## 10 năm hiện tại
## Lời khuyên`,

  wealth: `Xem tiền bạc của tôi theo 3 phần (kiếm tiền thế nào, giữ tiền thế nào):

## Tóm lại
## 10 năm hiện tại
## Lời khuyên`,

  health: `Xem sức khỏe của tôi theo 3 phần:

## Tóm lại
## Cần để ý
## Lời khuyên`,

  personality: `Xem tính cách của tôi theo 3 phần:

## Tóm lại
## Điểm mạnh
## Điểm cần rèn`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   'bản thân, tính cách, cách cục bẩm sinh',
  '兄弟宫': 'anh chị em, người hợp tác',
  '夫妻宫': 'quan hệ tình cảm, hôn nhân',
  '子女宫': 'duyên con cái, cấp dưới',
  '财帛宫': 'nguồn tài lộc, cách kiếm tiền',
  '疾厄宫': 'sức khỏe, tai nạn',
  '迁移宫': 'cơ hội khi ra ngoài, quan hệ xã hội',
  '交友宫': 'bạn bè, quý nhân, tiểu nhân',
  '官禄宫': 'thành tựu sự nghiệp, địa vị xã hội',
  '田宅宫': 'nhà đất, môi trường gia đình',
  '福德宫': 'đời sống tinh thần, phúc phận nội tâm',
  '父母宫': 'quan hệ với cha mẹ, giấy tờ hợp đồng',
};

/** Render AI markdown: "## Title" (or legacy **【Title】**) → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^#{1,3}\s+(.+)$/) ?? line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--t-gold)' }}>
                {sectionMatch[1].replace(/\*\*/g, '')}
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  // Answers to preset prompts (topics / palaces / Tứ Hóa), so repeat clicks don't call the AI again.
  const answerCache = useRef<Map<string, string>>(new Map());
  // A palace / Tứ Hóa the user clicked: offered as a one-tap question instead of calling the AI right away.
  const [suggestion, setSuggestion] = useState<{ label: string; prompt: string } | null>(null);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${viTerm(s.name)}${s.siHua ? ' ' + viTerm('化' + s.siHua) : ''}`).join(', ')
      : 'Vô Chính Diệu (mượn sao cung đối diện)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const palaceVi = `cung ${viTerm(selectedPalace.name)}`;
    const prompt = `Xem ${palaceVi} của tôi (chủ về: ${role}; chính tinh: ${starDesc}) theo 3 phần:

## Tóm lại
## Ảnh hưởng đến tôi
## Lời khuyên`;

    setSuggestion({ label: `Giải đoán ${palaceVi}`, prompt });
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar ? `cung ${viTerm(palaceOfStar.name)}` : 'cung chưa xác định';
    const viewLabel = selectedSiHua.view === 'daxian' ? 'Đại hạn' : 'Lưu niên';
    const hua = viTerm('化' + selectedSiHua.siHua);
    const starHua = `${viTerm(selectedSiHua.starName)} ${hua}`;

    const prompt = `${starHua} (${viewLabel}) rơi vào ${palaceName}. Nó ảnh hưởng gì đến tôi? Trả lời theo 3 phần:

## Tóm lại
## Ảnh hưởng trong ${viewLabel.toLowerCase()}
## Lời khuyên`;

    setSuggestion({ label: `Giải đoán ${starHua}`, prompt });
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[], cacheKey?: string) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const err = typeof body?.error === 'string' ? body.error : '';
        throw new Error(err.includes('ANTHROPIC_API_KEY') ? 'api-missing' : 'request-failed');
      }
      if (!res.body) throw new Error('no-stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
      if (cacheKey && assistantText.trim()) answerCache.current.set(cacheKey, assistantText);
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? 'Tính năng giải đoán AI chưa được cấu hình: máy chủ cần khóa ANTHROPIC_API_KEY. Hãy thêm khóa vào tệp .env.local rồi khởi động lại máy chủ. Việc lập lá số không cần khóa này.' : 'Không tạo được phần giải đoán. Hãy thử lại sau ít phút.' }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };

    // Preset prompt answered before → show the saved answer, no AI call.
    const cached = hidden ? answerCache.current.get(text) : undefined;
    if (cached) {
      setMessages(prev => [...prev, userMsg, { role: 'assistant', content: cached }]);
      loadingRef.current = false;
      setLoading(false);
      return;
    }
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages, hidden ? text : undefined);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden card-glass h-[460px] lg:h-[min(80vh,720px)]">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[12px] leading-relaxed max-w-[260px]" style={{ color: 'var(--t-faint)' }}>Chọn một chủ đề ở trên, bấm vào một cung, hoặc đặt câu hỏi để AI giải đoán.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[11px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
                  Giải đoán
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        {suggestion && (
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => { const s = suggestion; setSuggestion(null); sendMessage(s.prompt, true); }}
              disabled={loading}
              className="flex-1 min-w-0 truncate text-left text-[12px] px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              style={{ background: 'rgba(212,168,67,0.10)', border: '1px solid rgba(212,168,67,0.3)', color: 'var(--t-gold)' }}
            >
              ✦ {suggestion.label}
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              aria-label="Bỏ gợi ý"
              className="text-[12px] px-2 py-2 rounded-lg"
              style={{ color: 'var(--t-faint)', border: '1px solid var(--t-border)' }}
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Hỏi thêm, ví dụ: Năm nay có nên đổi việc không?"
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {loading ? '…' : 'Hỏi'}
          </button>
        </div>
      </div>

    </div>
  );
}
