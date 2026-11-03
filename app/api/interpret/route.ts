import Anthropic from '@anthropic-ai/sdk';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { viTerm } from '@/lib/i18n/vi';

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

const SYSTEM_PROMPT = `You are a Zi Wei Dou Shu (Tử Vi Đẩu Số) reader following Ni Haixia's Tian Ji system, writing for ordinary Vietnamese users who have never studied Tử Vi.

Language and tone:
- Always write in natural, everyday Vietnamese, even if the request contains Chinese. Address the reader as "bạn". Never use "đương số", "mệnh chủ" or other stiff terms for the reader.
- Say the plain meaning first. Mention a technical term only when it helps, at most once, in parentheses after the plain explanation, e.g. "bạn dễ bị hiểu lầm khi nói thẳng (Cự Môn Hóa Kỵ ở Mệnh)".
- Use only the Vietnamese star and palace names exactly as written in the chart data below (e.g. Triệt, Tuần, Hóa Kỵ, Thái Dương). Do not invent other spellings and never write Chinese characters.
- Do not list stars one by one with brightness in brackets. Pick the 2–3 factors that matter most and explain what they mean for the reader's life.
- No literal translations of Chinese idioms; say what they mean in plain Vietnamese.

Length and format:
- Follow the section headings the user asks for, written as Markdown "## Heading" lines. No other headings.
- Each section: 2–4 short bullet points or 1–3 short sentences. The whole answer stays under 350 words unless the user explicitly asks for more detail.
- Free-form questions: answer directly in a few sentences, no headings unless useful.
- Do not repeat disclaimers. At most one short closing line, and only when the topic is health, money or family (e.g. "Đây chỉ là xu hướng tham khảo.").

Content rules:
- Base every statement on the chart data below. Do not invent stars or transformations.
- Be practical and balanced: no fatalistic predictions. For health, describe tendencies and suggest seeing a doctor when relevant; never diagnose.
- Readings about parents, siblings and children are less reliable in this system; keep them brief.`;

// Brightness as Vietnamese practitioners usually name it (Miếu / Vượng / Đắc / Bình / Hãm).
const BRIGHTNESS_VI: Record<string, string> = {
  '庙': 'Miếu', '旺': 'Vượng', '得': 'Đắc', '利': 'Đắc', '地': 'Đắc',
  '平': 'Bình', '不': 'Bình', '闲': 'Bình', '陷': 'Hãm',
};

function starLabel(s: ZiweiChart['palaces'][number]['stars'][number]): string {
  let label = viTerm(s.name);
  if (s.brightnessRaw) label += ` (${BRIGHTNESS_VI[s.brightnessRaw] ?? viTerm(s.brightnessRaw)})`;
  if (s.siHua) label += ` ${viTerm('化' + s.siHua)}`;
  return label;
}

const branchVi = (i: number) => viTerm(BRANCHES[i]);
const stemBranchVi = (stem: number, branch: number) => `${viTerm(STEMS[stem])} ${branchVi(branch)}`;

/** Render the chart as compact plain text for the model, using Vietnamese terms only. */
function chartToText(chart: ZiweiChart): string {
  const b = chart.birthInfo;
  const l = chart.lunarInfo;
  const lines: string[] = [];
  lines.push('## Thông tin sinh');
  lines.push(`- Giới tính: ${b.gender === 'male' ? 'Nam' : 'Nữ'}${chart.yinYangGender ? ` (${viTerm(chart.yinYangGender)})` : ''}`);
  lines.push(`- Dương lịch: ${b.day}/${b.month}/${b.year}, giờ ${branchVi(b.hour)}`);
  lines.push(`- Âm lịch: ${l.lunarDay}/${Math.abs(l.lunarMonth)}${l.isLeapMonth ? ' (nhuận)' : ''}/${l.lunarYear}, năm ${stemBranchVi(l.yearStem, l.yearBranch)}`);
  lines.push(`- Cục: ${viTerm(chart.wuxingJuName)}`);
  lines.push(`- Mệnh tại ${branchVi(chart.mingGongBranch)}, Thân tại ${branchVi(chart.shenGongBranch)}`);
  if (chart.mingZhu) lines.push(`- Mệnh chủ: ${viTerm(chart.mingZhu)}`);
  if (chart.shenZhu) lines.push(`- Thân chủ: ${viTerm(chart.shenZhu)}`);
  lines.push(`- Tuổi hiện tại (tuổi mụ): ${chart.currentAge}`);

  lines.push('', '## 12 cung');
  for (const p of chart.palaces) {
    const tags = [p.isMingGong && 'cung Mệnh', p.isShenGong && 'Thân cư', p.isCurrentDaXian && 'đại hạn hiện tại'].filter(Boolean);
    lines.push(`### ${viTerm(p.name)} — ${stemBranchVi(p.stem, p.branch)}${tags.length ? ` (${tags.join(', ')})` : ''}${p.daXianAge ? `, đại hạn ${p.daXianAge[0]}–${p.daXianAge[1]} tuổi` : ''}`);
    const byType = (t: string) => p.stars.filter(s => s.type === t).map(starLabel).join(', ') || '—';
    lines.push(`- Chính tinh: ${byType('major')}`);
    lines.push(`- Cát tinh: ${byType('lucky')}`);
    lines.push(`- Sát tinh: ${byType('sha')}`);
    lines.push(`- Sao khác: ${byType('minor')}`);
    if (p.isEmpty && p.borrowedStars?.length) {
      lines.push(`- Vô Chính Diệu, mượn sao cung ${viTerm(p.borrowedFromName ?? '')}: ${p.borrowedStars.map(viTerm).join(', ')}`);
    }
    if (p.selfSihua?.length) {
      lines.push(`- Tự Hóa: ${p.selfSihua.map(m => `${viTerm(m.starName)} ${viTerm('化' + m.siHua)}`).join(', ')}`);
    }
  }

  lines.push('', '## Đại hạn');
  for (const d of chart.daXians) {
    const sh = d.siHua
      ? `; Tứ Hóa: ${viTerm(d.siHua.lu)} Hóa Lộc, ${viTerm(d.siHua.quan)} Hóa Quyền, ${viTerm(d.siHua.ke)} Hóa Khoa, ${viTerm(d.siHua.ji)} Hóa Kỵ`
      : '';
    lines.push(`- ${d.startAge}–${d.endAge} tuổi: cung ${viTerm(d.palaceName)}${d.stemName ? ` (can ${viTerm(d.stemName)})` : ''}${sh}`);
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
                text: `# Lá số của người dùng\n\n${chartToText(parsed.chart)}`,
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
