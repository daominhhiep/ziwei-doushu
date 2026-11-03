/**
 * 古籍原典查询库 — 入口
 *
 * 加载所有古籍数据 + 提供查询/搜索 API
 * 数据为 JSON 静态打包，零 DB 依赖、零网络请求
 */

import type { Book, Paragraph, SearchHit } from './types';
import { guSuiFu } from './data/gusuifu';
import { ziWeiQuanJi } from './data/quanji';
import { ziWeiQuanShu } from './data/quanshu';

/** 所有已收录古籍 */
export const ALL_BOOKS: Book[] = [
  guSuiFu,
  ziWeiQuanJi,
  ziWeiQuanShu,
];

/** 总段落数（用于首页统计） */
export const TOTAL_PARAGRAPHS = ALL_BOOKS.reduce(
  (sum, b) => sum + b.chapters.reduce((s, c) => s + c.paragraphs.length, 0),
  0,
);

/** 按 slug 取书 */
export function getBookBySlug(slug: string): Book | null {
  return ALL_BOOKS.find(b => b.slug === slug) ?? null;
}

/** 按章节序号取章节 */
export function getChapter(bookSlug: string, chapterIdx: number) {
  const book = getBookBySlug(bookSlug);
  if (!book) return null;
  const chapter = book.chapters[chapterIdx];
  if (!chapter) return null;
  return { book, chapter, chapterIdx };
}

/** 按段落 id 取段落（含书与章节信息）*/
export function getParagraphById(id: string) {
  for (const book of ALL_BOOKS) {
    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      const p = ch.paragraphs.find(p => p.id === id);
      if (p) {
        return { book, chapter: ch, chapterIdx: i, paragraph: p };
      }
    }
  }
  return null;
}

/**
 * 全文搜索
 *
 * 简单子字符串匹配：先匹配中文原文，再匹配越南语译文（不区分大小写）
 * 繁简转换暂不支持
 */
export function searchClassics(query: string, limit = 30): SearchHit[] {
  const q = query.trim();
  if (q.length < 1) return [];
  const qLower = q.toLowerCase();

  const hits: SearchHit[] = [];
  for (const book of ALL_BOOKS) {
    for (const chapter of book.chapters) {
      for (const p of chapter.paragraphs) {
        let source = p.text;
        let matchedIn: SearchHit['matchedIn'] = 'text';
        let idx = p.text.indexOf(q);
        if (idx < 0 && p.translation) {
          source = p.translation;
          matchedIn = 'translation';
          idx = p.translation.toLowerCase().indexOf(qLower);
        }
        if (idx < 0) continue;

        hits.push({
          bookSlug: book.slug,
          bookTitle: book.title,
          chapterTitle: chapter.title,
          paragraphId: p.id,
          snippet: makeSnippet(source, idx, q.length),
          text: p.text,
          translation: p.translation,
          matchedIn,
        });

        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

/** 提取上下文（前后各 40 字）并高亮命中部分 */
function makeSnippet(source: string, idx: number, len: number): string {
  const start = Math.max(0, idx - 40);
  const end = Math.min(source.length, idx + len + 40);
  return (start > 0 ? '…' : '')
    + escapeHtml(source.slice(start, idx))
    + `<mark>${escapeHtml(source.slice(idx, idx + len))}</mark>`
    + escapeHtml(source.slice(idx + len, end))
    + (end < source.length ? '…' : '');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type { Book, Chapter, Paragraph, SearchHit } from './types';
