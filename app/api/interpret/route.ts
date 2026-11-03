import Anthropic from '@anthropic-ai/sdk';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import type { ZiweiChart } from '@/lib/ziwei/types';

/**
 * POST /api/interpret — AI chart interpretation via Claude.
 *
 * Request:  { chart: ZiweiChart, messages: { role: 'user' | 'assistant', content: string }[] }
 * Response: text/event-stream, lines of `data: {"delta":{"text":"..."}}`, ending with `data: [DONE]`
 *           (the format consumed by components/InsightPanel.tsx and components/ChatPanel.tsx).
 *
 * Requires ANTHROPIC_API_KEY in .env.local. Answers are always written in Vietnamese.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-5-5';
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;

const SYSTEM_PROMPT = `You are an expert Zi Wei Dou Shu (Tử Vi Đẩu Số) reader trained in Ni Haixia's Tian Ji (倪海厦《天纪》) system.

Language rules (strict):
- Always answer in Vietnamese, even when the user's question or requested section headings are written in Chinese. Translate any requested headings into Vietnamese.
- Use the standard Sino-Vietnamese (Hán Việt) terms Vietnamese practitioners use: palaces (Mệnh, Huynh Đệ, Phu Thê, Tử Nữ, Tài Bạch, Tật Ách, Thiên Di, Nô Bộc/Giao Hữu, Quan Lộc, Điền Trạch, Phúc Đức, Phụ Mẫu, Thân), stars (Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân, Văn Xương, Văn Khúc, Tả Phù, Hữu Bật, Thiên Khôi, Thiên Việt, Lộc Tồn, Thiên Mã, Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, Địa Không, Địa Kiếp…), Four Transformations (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ), brightness (Miếu, Vượng, Đắc, Lợi, Bình, Bất, Nhàn, Hãm), Heavenly Stems and Earthly Branches (Giáp Ất Bính Đinh…, Tý Sửu Dần Mão…), Đại Hạn, Lưu Niên, Ngũ Hành Cục.
- Do not leave Chinese characters in the answer unless quoting a classical text; when quoting, give the Vietnamese meaning right after.

Reading rules:
- Base every statement on the chart data provided below; name the palace and stars that support it. Do not invent stars or transformations that are not in the chart.
- Readings about family relations (parents, siblings, children) are for reference only; say so briefly when they come up.
- Be practical and balanced: no fatalistic predictions, no medical, legal or financial certainties. For health, describe tendencies and suggest seeing a doctor rather than diagnosing.
- Use Markdown with short sections.`;

function starLabel(s: ZiweiChart['palaces'][number]['stars'][number]): string {
  let label = s.name;
  if (s.brightnessRaw) label += `(${s.brightnessRaw})`;
  if (s.siHua) label += `[化${s.siHua}]`;
  return label;
}

/** Render the chart as compact plain text for the model. Chinese terms are kept; the model translates them. */
function chartToText(chart: ZiweiChart): string {
  const b = chart.birthInfo;
  const l = chart.lunarInfo;
  const lines: string[] = [];
  lines.push('## Birth data');
  lines.push(`- Gender: ${b.gender === 'male' ? 'male' : 'female'}${chart.yinYangGender ? ` (${chart.yinYangGender})` : ''}`);
  lines.push(`- Solar date: ${b.year}-${b.month}-${b.day}, hour branch ${BRANCHES[b.hour] ?? b.hour}`);
  lines.push(`- Lunar date: ${l.lunarYear}-${l.isLeapMonth ? 'leap ' : ''}${Math.abs(l.lunarMonth)}-${l.lunarDay}, year ${STEMS[l.yearStem]}${BRANCHES[l.yearBranch]}`);
  if (l.fourPillars) lines.push(`- Four pillars: ${l.fourPillars.join(' ')}`);
  lines.push(`- Five-element bureau: ${chart.wuxingJuName}`);
  lines.push(`- Life palace branch: ${BRANCHES[chart.mingGongBranch]}, Body palace branch: ${BRANCHES[chart.shenGongBranch]}`);
  if (chart.mingZhu) lines.push(`- 命主: ${chart.mingZhu}`);
  if (chart.shenZhu) lines.push(`- 身主: ${chart.shenZhu}`);
  lines.push(`- Current age (虚岁): ${chart.currentAge}`);

  lines.push('', '## Palaces');
  for (const p of chart.palaces) {
    const tags = [p.isMingGong && '命宫', p.isShenGong && '身宫', p.isCurrentDaXian && 'current decade'].filter(Boolean);
    const head = `### ${p.name} — ${STEMS[p.stem]}${BRANCHES[p.branch]}${tags.length ? ` (${tags.join(', ')})` : ''}${p.daXianAge ? `, decade ages ${p.daXianAge[0]}-${p.daXianAge[1]}` : ''}`;
    lines.push(head);
    const byType = (t: string) => p.stars.filter(s => s.type === t).map(starLabel).join(' ') || '—';
    lines.push(`- Major: ${byType('major')}`);
    lines.push(`- Lucky: ${byType('lucky')}`);
    lines.push(`- Malefic: ${byType('sha')}`);
    lines.push(`- Minor: ${byType('minor')}`);
    if (p.isEmpty && p.borrowedStars?.length) {
      lines.push(`- Empty palace, borrows from ${p.borrowedFromName ?? 'opposite palace'}: ${p.borrowedStars.join(' ')}`);
    }
    if (p.selfSihua?.length) {
      lines.push(`- Self-transformation: ${p.selfSihua.map(m => `${m.starName}化${m.siHua}`).join(', ')}`);
    }
  }

  lines.push('', '## Decades (大限)');
  for (const d of chart.daXians) {
    const sh = d.siHua ? `, 四化: ${d.siHua.lu}化禄 ${d.siHua.quan}化权 ${d.siHua.ke}化科 ${d.siHua.ji}化忌` : '';
    lines.push(`- Ages ${d.startAge}-${d.endAge}: ${d.palaceName}${d.stemName ? ` (${d.stemName})` : ''}${sh}`);
  }
  return lines.join('\n');
}

type InMessage = { role: 'user' | 'assistant'; content: string };

function parseBody(body: unknown): { chart: ZiweiChart; messages: InMessage[] } | null {
  if (!body || typeof body !== 'object') return null;
  const { chart, messages } = body as { chart?: unknown; messages?: unknown };
  if (!chart || typeof chart !== 'object' || !Array.isArray((chart as ZiweiChart).palaces)) return null;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  const clean: InMessage[] = [];
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    if (m.content.length > MAX_MESSAGE_CHARS) return null;
    if (m.content.trim() === '') continue;
    clean.push({ role: m.role, content: m.content });
  }
  // The API requires the conversation to start with a user turn.
  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (clean.length === 0 || clean[clean.length - 1].role !== 'user') return null;
  return { chart: chart as ZiweiChart, messages: clean };
}

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(500, 'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the server.');
  }

  let parsed;
  try {
    parsed = parseBody(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) {
    return jsonError(400, 'Invalid request: expected { chart, messages } with the last message from the user.');
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController<Uint8Array>, text: string) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const claudeStream = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 16000,
            output_config: { effort: 'medium' },
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            system: [
              { type: 'text', text: SYSTEM_PROMPT },
              {
                type: 'text',
                text: `# The user's natal chart\n\n${chartToText(parsed.chart)}`,
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages: parsed.messages,
          },
          { signal: request.signal },
        );

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            send(controller, event.delta.text);
          }
        }

        const final = await claudeStream.finalMessage();
        if (final.stop_reason === 'refusal') {
          send(controller, '\n\n_Không thể trả lời câu hỏi này. Bạn hãy đặt lại câu hỏi theo cách khác._');
        } else if (final.stop_reason === 'max_tokens') {
          send(controller, '\n\n_Câu trả lời quá dài nên bị cắt. Bạn hãy hỏi hẹp hơn để xem tiếp._');
        }
      } catch (err) {
        if (!request.signal.aborted) {
          console.error('[api/interpret]', err);
          const msg =
            err instanceof Anthropic.AuthenticationError
              ? 'Khóa API Claude không hợp lệ. Hãy kiểm tra ANTHROPIC_API_KEY trong .env.local.'
              : err instanceof Anthropic.RateLimitError
                ? 'Dịch vụ AI đang quá tải. Hãy thử lại sau ít phút.'
                : 'Không lấy được luận giải từ AI. Hãy thử lại sau.';
          send(controller, `\n\n_${msg}_`);
        }
      } finally {
        try {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch {
          /* client already disconnected */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
