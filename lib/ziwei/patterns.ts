/**
 * 紫微斗数格局识别（v2 严格化版本）
 *
 * 设计原则：
 * 1. 古书条件优先：每个格局列出"必须 / 加分 / 破格"三层结构，出处可考
 * 2. 倪师立场：不使用宫干自化、大限四化、来因宫等飞星派工具
 * 3. 庙旺利陷：用 brightness 字段（bright=庙旺、normal=平、dim=陷）
 * 4. 三方四正会照：命宫 + 财帛 + 官禄 + 迁移
 * 5. 夹宫：命宫前后两宫
 *
 * 主要古籍出处：
 *  - 《紫微斗数全集》（陈抟祖师传，明代刊本）
 *  - 《紫微斗数全书》（罗洪先编，明代刊本）
 *  - 《骨髓赋》《女命骨髓赋》《十二宫诸星得地合格诀》
 *  - 倪师《天纪》紫微斗数讲义
 */

import 'server-only';
import type { ZiweiChart, Palace, Star, SiHua } from './types';
import { viTerm } from '../i18n/vi';

// ────────────────── 类型 ──────────────────
export interface PatternCondition {
  required: string[];   // 必须满足条件（已通过的）
  bonus?: string[];     // 加分项（已触发）
  breaking?: string[];  // 破格警示（已触发）
}

export interface Pattern {
  id: string;                        // 稳定标识（原中文格局名，测试/逻辑用）
  name: string;                      // 显示名（越南语）
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  description: string;
  palaces: string[];                 // 涉及宫位
  conditions?: PatternCondition;     // 成立条件分层（v2 新增）
  source?: string;                   // 古籍出处（v2 新增）
}

// ────────────────── 常量 ──────────────────
const SHA_NAMES = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
const SHA_HARD = ['擎羊', '陀罗', '火星', '铃星'];   // 四煞
const SHA_KONG = ['地空', '地劫'];                  // 空劫
const ZUO_YOU = ['左辅', '右弼'];
const CHANG_QU = ['文昌', '文曲'];
const KUI_YUE = ['天魁', '天钺'];

// ────────────────── 辅助函数 ──────────────────
function getMajorStarNames(palace: Palace): string[] {
  return palace.stars.filter(s => s.type === 'major').map(s => s.name);
}
function findStar(palace: Palace, name: string): Star | undefined {
  return palace.stars.find(s => s.name === name);
}
function hasStar(palace: Palace, name: string): boolean {
  return palace.stars.some(s => s.name === name);
}
function findStarPalace(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces.find(p => p.stars.some(s => s.name === name));
}
function getPalaceByBranch(chart: ZiweiChart, branch: number): Palace | undefined {
  return chart.palaces.find(p => p.branch === ((branch % 12) + 12) % 12);
}
function shaCountInPalace(palace: Palace, list: string[] = SHA_HARD): number {
  return palace.stars.filter(s => list.includes(s.name)).length;
}
function hasShaInPalace(palace: Palace, list: string[] = SHA_NAMES): boolean {
  return palace.stars.some(s => list.includes(s.name));
}
function getSanFangPalaces(chart: ZiweiChart): Palace[] {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.filter(p => branches.includes(p.branch));
}
function isInSanFang(chart: ZiweiChart, branch: number): boolean {
  const m = chart.mingGongBranch;
  return [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12].includes(branch);
}
function getDuiGong(chart: ZiweiChart, branch: number): Palace | undefined {
  return getPalaceByBranch(chart, (branch + 6) % 12);
}
function getJiaPalaces(chart: ZiweiChart, branch: number): { prev?: Palace; next?: Palace } {
  return {
    prev: getPalaceByBranch(chart, (branch + 11) % 12),
    next: getPalaceByBranch(chart, (branch + 1) % 12),
  };
}
function sanFangAllStars(chart: ZiweiChart): Set<string> {
  return new Set(getSanFangPalaces(chart).flatMap(p => p.stars.map(s => s.name)));
}
function sanFangShaCount(chart: ZiweiChart, list: string[] = SHA_HARD): number {
  return getSanFangPalaces(chart).reduce((sum, p) => sum + shaCountInPalace(p, list), 0);
}
function isBright(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'bright';
}
function isDim(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'dim';
}
function getStarSiHua(palace: Palace, starName: string): Star['siHua'] | undefined {
  return findStar(palace, starName)?.siHua;
}
// 四化挂在星曜的 siHua 字段上，不是独立星名——不能用 hasStar / sanFangAllStars 查「化禄」
function palaceHasSiHua(palace: Palace, hua: SiHua): boolean {
  return palace.stars.some(s => s.siHua === hua);
}
function sanFangHasSiHua(chart: ZiweiChart, hua: SiHua): boolean {
  return getSanFangPalaces(chart).some(p => palaceHasSiHua(p, hua));
}
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ────────────────── 正格识别器 ──────────────────

/** 君臣庆会：紫微入命，左辅右弼同会（同宫或三方） */
function detectJunChenQingHui(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微')) return;
  const sanFangSet = sanFangAllStars(chart);
  const hasZuo = sanFangSet.has('左辅');
  const hasYou = sanFangSet.has('右弼');
  if (!hasZuo || !hasYou) return;

  const required = ['Tử Vi nhập Mệnh', 'Tả Phù, Hữu Bật đồng hội tam phương tứ chính'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Gặp thêm Văn Xương hoặc Văn Khúc');
  if (sanFangSet.has('天魁') || sanFangSet.has('天钺')) bonus.push('Khôi Việt quý nhân gia chiếu');
  if (getStarSiHua(ming, '紫微') === '权') bonus.push('Tử Vi Hóa Quyền');
  if (sanFangShaCount(chart, SHA_KONG) >= 2) breaking.push('Địa Không, Địa Kiếp cùng hội chiếu (Tử Vi kỵ Không Kiếp)');

  patterns.push({
    id: '君臣庆会',
    name: 'Quân Thần Khánh Hội',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Tử Vi nhập Mệnh, Tả Phù Hữu Bật đồng hội, như đế vương được hiền thần phò tá, chủ mệnh đại phú đại quý, có tài thống lĩnh. Cả đời quý nhân không dứt, hợp đi con đường địa vị cao trong chính trường, thương trường, hoặc làm người dẫn dắt đa lĩnh vực.',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·君臣庆会格》 (Tử Vi Đẩu Số Toàn Thư – Quân Thần Khánh Hội cách)',
  });
}

/** 紫府同宫：紫微+天府于命宫（限寅、申宫） */
function detectZiFu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const ziwei = findStarPalace(chart, '紫微');
  const tianfu = findStarPalace(chart, '天府');
  if (!ziwei || !tianfu || ziwei.branch !== tianfu.branch) return;

  const inMing = ziwei.branch === chart.mingGongBranch;
  const required = inMing
    ? ['Tử Vi, Thiên Phủ cùng nhập cung Mệnh']
    : ['Tử Vi, Thiên Phủ đồng cung (không ở cung Mệnh, chỉ hội chiếu nên giảm lực)'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Tả Phù, Hữu Bật đồng hội');
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Gặp thêm Xương Khúc');
  if (hasShaInPalace(ziwei, SHA_KONG)) breaking.push('Cung Tử Phủ có Không Kiếp tọa thủ (phá quý khí của Tử Phủ)');
  if (shaCountInPalace(ziwei, SHA_HARD) >= 2) breaking.push('Cung Tử Phủ có hai sát tinh đồng tọa');

  patterns.push({
    id: '紫府同宫',
    name: 'Tử Phủ đồng cung',
    level: inMing && !breaking.length ? 'excellent' : 'good',
    description: inMing
      ? 'Tử Vi, Thiên Phủ cùng nhập cung Mệnh, đế tinh và tướng tinh cùng giáng, là mệnh tôn quý. Chủ phẩm hạnh đoan chính, cơm áo không lo, có tài lãnh đạo, hợp giữ chức vụ quan trọng. Cần có Tả Phù, Hữu Bật phối hợp mới thành đại cách trọn vẹn.'
      : 'Tử Vi, Thiên Phủ đồng cung nhưng không tọa Mệnh, chủ cả đời có quý nhân, quý khí để nương tựa, nhưng bản thân chưa chắc đại phú quý, còn tùy cát tinh hay sát tinh hội chiếu.',
    palaces: [ziwei.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·紫府同宫格》 (Tử Vi Đẩu Số Toàn Thư – Tử Phủ đồng cung cách)',
  });
}

/** 府相朝垣：天府、天相分别坐守命宫的三方四正 */
function detectFuXiangChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tianfu = findStarPalace(chart, '天府');
  const tianxiang = findStarPalace(chart, '天相');
  if (!tianfu || !tianxiang) return;
  if (!isInSanFang(chart, tianfu.branch) || !isInSanFang(chart, tianxiang.branch)) return;
  if (tianfu.branch === chart.mingGongBranch && tianxiang.branch === chart.mingGongBranch) return;
  if (tianfu.branch === tianxiang.branch) return;

  const required = ['Thiên Phủ tọa tam phương cung Mệnh', 'Thiên Tướng tọa tam phương cung Mệnh', 'Hai sao không đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(ming, '禄存') || palaceHasSiHua(ming, '禄')) bonus.push('Cung Mệnh gặp Lộc');
  if (sanFangAllStars(chart).has('左辅')) bonus.push('Gặp thêm Tả Phù');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh có sát tinh tọa thủ');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Tam phương tứ chính có quá nhiều sát tinh');

  patterns.push({
    id: '府相朝垣',
    name: 'Phủ Tướng triều viên',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thiên Phủ, Thiên Tướng chia nhau giữ tam phương tứ chính cung Mệnh, văn võ hỗ trợ, quyền ấn cùng rạng, chủ cả đời cơm áo đầy đủ, địa vị cao. Sách xưa viết "府相朝垣，千钟食禄" (Phủ Tướng triều viên, hưởng lộc nghìn chung), thường thấy ở người trong chính giới, nhà quản lý doanh nghiệp.',
    palaces: [tianfu.name, tianxiang.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·府相朝垣格》 (Tử Vi Đẩu Số Toàn Thư – Phủ Tướng triều viên cách)',
  });
}

/** 阳梁昌禄：太阳+天梁+文昌+禄存四星会命宫，大贵格 */
function detectYangLiangChangLu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('太阳') || !sanFangSet.has('天梁') ||
      !sanFangSet.has('文昌') || !sanFangSet.has('禄存')) return;

  const sun = findStarPalace(chart, '太阳')!;
  const liang = findStarPalace(chart, '天梁')!;
  const required = [
    'Thái Dương hội tam phương cung Mệnh',
    'Thiên Lương hội tam phương cung Mệnh',
    'Văn Xương hội tam phương cung Mệnh',
    'Lộc Tồn hội tam phương cung Mệnh',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sun, '太阳')) bonus.push('Thái Dương Miếu Vượng');
  if (isBright(liang, '天梁')) bonus.push('Thiên Lương Miếu Vượng');
  if (sanFangHasSiHua(chart, '科')) bonus.push('Gặp thêm Hóa Khoa');
  if (isDim(sun, '太阳')) breaking.push('Thái Dương hãm địa (Dương Lương mất ánh sáng)');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Tam phương sát tinh nặng');

  patterns.push({
    id: '阳梁昌禄',
    name: 'Dương Lương Xương Lộc',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Bốn sao Thái Dương, Thiên Lương, Văn Xương, Lộc Tồn cùng hội tam phương cung Mệnh, được gọi là "sao khoa cử", chủ thanh quý hiển đạt, vận thi cử cực tốt, hợp con đường học thuật, giáo dục, nghiên cứu, chứng chỉ chuyên môn; công danh cả đời dễ thành.',
    palaces: [sun.name, liang.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·阳梁昌禄格》 (Tử Vi Đẩu Số Toàn Thư – Dương Lương Xương Lộc cách)',
  });
}

/** 火贪格 / 铃贪格：贪狼+火星 或 贪狼+铃星 同宫或会照 */
function detectHuoTanLingTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tan = findStarPalace(chart, '贪狼');
  if (!tan) return;
  const huo = findStarPalace(chart, '火星');
  const ling = findStarPalace(chart, '铃星');

  for (const [shaName, shaPalace] of [['火星', huo], ['铃星', ling]] as const) {
    if (!shaPalace) continue;
    const sameOrTrine =
      tan.branch === shaPalace.branch ||
      (tan.branch + 4) % 12 === shaPalace.branch ||
      (tan.branch + 8) % 12 === shaPalace.branch ||
      (tan.branch + 6) % 12 === shaPalace.branch;
    if (!sameOrTrine) continue;
    if (!isInSanFang(chart, tan.branch)) continue;

    const required = [`Tham Lang ${tan.branch === shaPalace.branch ? 'đồng cung' : 'hội chiếu'} ${viTerm(shaName)}`, 'Tham Lang hội chiếu tam phương cung Mệnh'];
    const bonus: string[] = [];
    const breaking: string[] = [];
    if (isBright(tan, '贪狼')) bonus.push('Tham Lang Miếu Vượng');
    if (getStarSiHua(tan, '贪狼') === '禄' || getStarSiHua(tan, '贪狼') === '权') bonus.push('Tham Lang Hóa Lộc/Hóa Quyền');
    if (hasShaInPalace(tan, ['擎羊', '陀罗'])) breaking.push('Cung Tham Lang lại gặp Kình Đà (phá lực hoạnh phát)');
    if (hasShaInPalace(tan, SHA_KONG)) breaking.push('Tham Lang gặp Không Kiếp (tiền đến rồi đi)');

    patterns.push({
      id: shaName === '火星' ? '火贪格' : '铃贪格',
      name: shaName === '火星' ? 'Hỏa Tham cách' : 'Linh Tham cách',
      level: breaking.length ? 'good' : 'excellent',
      description: `Tham Lang gặp ${viTerm(shaName)} ${tan.branch === shaPalace.branch ? 'đồng cung' : 'hội chiếu từ tam phương'}, chủ phát tài bất ngờ, cơ hội đến đột ngột. Sách xưa viết “贪狼遇火铃，必发横财” (Tham Lang gặp Hỏa Linh, ắt phát hoạnh tài), nhưng đến nhanh thì đi cũng nhanh, nên biết dừng đúng lúc.${breaking.length ? ' Lá số này đã chạm điều kiện phá cách, sức phát bị giảm.' : ''}`,
      palaces: [tan.name, shaPalace.name],
      conditions: { required, bonus, breaking },
      source: '《紫微斗数骨髓赋》 (Tử Vi Đẩu Số Cốt Tủy Phú)',
    });
  }
}

/** 武贪格：武曲+贪狼 同宫（丑、未） 或 对照 */
function detectWuTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const tan = findStarPalace(chart, '贪狼');
  if (!wu || !tan) return;
  const sameOrOppose = wu.branch === tan.branch || (wu.branch + 6) % 12 === tan.branch;
  if (!sameOrOppose) return;
  if (!isInSanFang(chart, wu.branch) && !isInSanFang(chart, tan.branch)) return;

  const required = [
    wu.branch === tan.branch ? 'Vũ Khúc, Tham Lang đồng cung (Sửu/Mùi)' : 'Vũ Khúc, Tham Lang chiếu nhau từ cung đối',
    'Hội chiếu tam phương cung Mệnh',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('火星') || sanFangAllStars(chart).has('铃星'))
    bonus.push('Gặp thêm Hỏa Tinh/Linh Tinh (chồng thêm Hỏa Tham/Linh Tham)');
  if (getStarSiHua(wu, '武曲') === '禄') bonus.push('Vũ Khúc Hóa Lộc');
  if (hasShaInPalace(wu, ['擎羊', '陀罗'])) breaking.push('Cung Vũ Tham gặp Kình Đà');
  if (hasShaInPalace(wu, SHA_KONG)) breaking.push('Cung Vũ Tham gặp Không Kiếp');

  patterns.push({
    id: '武贪格',
    name: 'Vũ Tham cách',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Vũ Khúc, Tham Lang hội Mệnh, tài tinh và sao đào hoa – dục vọng cùng tỏa sáng. Sách xưa viết "武贪不发少年人" (Vũ Tham không phát khi còn trẻ) — sau ba mươi tuổi mới tích lũy dày mà bứt phá. Chủ từ trung niên trở đi đại phú đại quý, nguồn tài đến từ quan hệ, giao tế và biết tiết chế dục vọng; hợp tài chính, đầu cơ, kinh doanh bán hàng, giải trí.',
    palaces: [wu.name, tan.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数骨髓赋》 (Tử Vi Đẩu Số Cốt Tủy Phú)',
  });
}

/** 杀破狼：七杀、破军、贪狼三方齐聚 */
function detectShaPoLang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['七杀', '破军', '贪狼'].filter(s => sanFangSet.has(s));
  if (has.length < 3) return;

  const required = ['Ba sao Thất Sát, Phá Quân, Tham Lang cùng vào tam phương tứ chính cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangHasSiHua(chart, '禄') || sanFangHasSiHua(chart, '权')) bonus.push('Tam phương có Hóa Lộc hoặc Hóa Quyền (động mà có lực)');
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Tả Hữu đồng hội (trong biến động gặp quý nhân)');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Sát tinh quá nặng (động mà không thành)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Mệnh có Không Kiếp tọa thủ (động mà vất vả)');

  patterns.push({
    id: '杀破狼',
    name: 'Sát Phá Tham',
    level: breaking.length ? 'caution' : 'good',
    description: 'Ba sao Thất Sát, Phá Quân, Tham Lang hội Mệnh, là mệnh cách khai sáng, xông pha. Cả đời nhiều biến động, không cam chịu tầm thường, hợp khởi nghiệp, quân đội – công an, kinh doanh, bán hàng. Sau trung niên mới ổn định giữ thành, lúc trẻ dễ thất bại vì bốc đồng.',
    palaces: getSanFangPalaces(chart).filter(p => has.includes(getMajorStarNames(p)[0])).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·杀破狼》 (Tử Vi Đẩu Số Toàn Thư – Sát Phá Tham)',
  });
}

/** 机月同梁：天机、太阴、天同、天梁四星齐入命迁财官 */
function detectJiYueTongLiang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天机', '太阴', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length < 4) return;

  const required = ['Bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng vào tam phương tứ chính cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Gặp thêm Xương Khúc');
  if (sanFangHasSiHua(chart, '科')) bonus.push('Gặp thêm Hóa Khoa');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Quá nhiều sát tinh (Cơ Nguyệt Đồng Lương kỵ sát)');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh có sát tinh tọa thủ');

  patterns.push({
    id: '机月同梁',
    name: 'Cơ Nguyệt Đồng Lương',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng vào Mệnh, Thiên Di, Tài Bạch, Quan Lộc; nho nhã lịch thiệp, thông minh giỏi mưu tính. Hợp nhất với công chức, học thuật, văn nghệ, y tế, dịch vụ… những ngành cần tích lũy ổn định, không nên mạo hiểm hay đầu cơ lớn.',
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·机月同梁格》 (Tử Vi Đẩu Số Toàn Thư – Cơ Nguyệt Đồng Lương cách)',
  });
}

/** 廉贞天相：同宫 */
function detectLianXiang(chart: ZiweiChart, patterns: Pattern[]) {
  const lian = findStarPalace(chart, '廉贞');
  const xiang = findStarPalace(chart, '天相');
  if (!lian || !xiang || lian.branch !== xiang.branch) return;

  const inMing = lian.branch === chart.mingGongBranch;
  const required = ['Liêm Trinh, Thiên Tướng đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(lian, '禄存') || getStarSiHua(lian, '廉贞') === '禄') bonus.push('Gặp Lộc Tồn hoặc Liêm Trinh Hóa Lộc');
  if (sanFangAllStars(chart).has('左辅')) bonus.push('Tả Phù hội chiếu');
  if (hasShaInPalace(lian, ['擎羊'])) breaking.push('Cung Liêm Tướng có Kình Dương tọa thủ (khuynh hướng Liêm Sát Dương)');
  if (getStarSiHua(lian, '廉贞') === '忌') breaking.push('Liêm Trinh Hóa Kỵ');

  patterns.push({
    id: '廉贞天相格',
    name: 'Liêm Trinh Thiên Tướng cách',
    level: breaking.length ? 'caution' : (inMing ? 'good' : 'neutral'),
    description: 'Liêm Trinh, Thiên Tướng đồng cung, là cách cục ấn thụ, chủ làm việc công minh, có tiếng thanh liêm, hợp công chức, quản lý hành chính, pháp chế, hoạch định. Sợ gặp Kình Dương, Hóa Kỵ, khi đó lại chủ kiện tụng.',
    palaces: [lian.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 武曲七杀：同宫，将星配财星 */
function detectWuQiSha(chart: ZiweiChart, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const qi = findStarPalace(chart, '七杀');
  if (!wu || !qi || wu.branch !== qi.branch) return;

  const inMing = wu.branch === chart.mingGongBranch;
  const required = ['Vũ Khúc, Thất Sát đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(wu, '武曲') === '权') bonus.push('Vũ Khúc Hóa Quyền');
  if (getStarSiHua(wu, '武曲') === '禄') bonus.push('Vũ Khúc Hóa Lộc');
  if (getStarSiHua(wu, '武曲') === '忌') breaking.push('Vũ Khúc Hóa Kỵ (điềm báo kiếp tài, hao tài)');
  if (hasShaInPalace(wu, ['擎羊', '陀罗', '火星', '铃星'])) breaking.push('Cung Vũ Sát có quá nhiều sát tinh');

  patterns.push({
    id: '武曲七杀',
    name: 'Vũ Khúc Thất Sát',
    level: breaking.length ? 'caution' : (inMing ? 'excellent' : 'good'),
    description: 'Vũ Khúc, Thất Sát đồng cung, tướng tinh phối tài tinh, chủ quả quyết cương nghị, giỏi quản lý tiền bạc, hợp tài chính, quân đội – công an, khởi nghiệp. Nhưng kỵ gặp Hóa Kỵ và sát tinh, nếu không sẽ hung hiểm. Cả đời phấn đấu, tích được của nhưng nhiều lo toan.',
    palaces: [wu.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 天同天梁：同宫 */
function detectTongLiang(chart: ZiweiChart, patterns: Pattern[]) {
  const tong = findStarPalace(chart, '天同');
  const liang = findStarPalace(chart, '天梁');
  if (!tong || !liang || tong.branch !== liang.branch) return;

  const required = ['Thiên Đồng, Thiên Lương đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌')) bonus.push('Văn Xương hội chiếu');
  if (getStarSiHua(tong, '天同') === '禄') bonus.push('Thiên Đồng Hóa Lộc');
  if (hasShaInPalace(tong, SHA_HARD)) breaking.push('Có sát tinh đồng tọa');

  patterns.push({
    id: '天同天梁格',
    name: 'Thiên Đồng Thiên Lương cách',
    level: breaking.length ? 'neutral' : 'good',
    description: 'Thiên Đồng, Thiên Lương đồng cung, phúc tinh và ấm tinh cùng hội, chủ khoan hậu hiền hòa, vui lòng giúp người, hợp y tế, giáo dục, tôn giáo, công ích xã hội. Nhưng thiên về ôn hòa bảo thủ, khó thành cục đại phú đại quý.',
    palaces: [tong.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 日月同宫：太阳太阴丑或未宫同宫 */
function detectRiYueTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const sun = findStarPalace(chart, '太阳');
  const moon = findStarPalace(chart, '太阴');
  if (!sun || !moon || sun.branch !== moon.branch) return;
  if (sun.branch !== 1 && sun.branch !== 7) return;  // 必须丑(1) 或 未(7)

  const inMing = sun.branch === chart.mingGongBranch;
  const required = [`Thái Dương, Thái Âm cùng nhập cung ${viTerm(BRANCH_NAMES[sun.branch])}`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sun.branch === 7) bonus.push('Nhật Nguyệt cùng sáng tại Mùi (sách xưa nói Nhật Nguyệt ở Mùi đều đẹp)');
  if (sanFangAllStars(chart).has('文昌') && sanFangAllStars(chart).has('文曲')) bonus.push('Xương Khúc hội chiếu');
  if (hasShaInPalace(sun, SHA_HARD)) breaking.push('Cung Nhật Nguyệt có sát tinh đồng tọa');

  patterns.push({
    id: '日月同宫',
    name: 'Nhật Nguyệt đồng cung',
    level: breaking.length ? 'good' : (inMing ? 'excellent' : 'good'),
    description: `Thái Dương, Thái Âm đồng cung tại ${viTerm(BRANCH_NAMES[sun.branch])}, âm dương cân bằng, văn võ song toàn. Chủ duyên với người khác giới tốt, sự nghiệp thuận lợi, danh tiếng vang xa. ${sun.branch === 7 ? 'Nhật Nguyệt ở Mùi đều đẹp, càng tốt.' : 'Nhật Nguyệt đồng cung ở Sửu thì lực khá bình thường.'}`,
    palaces: [sun.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 日月夹命：太阳太阴在命宫前后两宫 */
function detectRiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasSun = hasStar(prev, '太阳');
  const prevHasMoon = hasStar(prev, '太阴');
  const nextHasSun = hasStar(next, '太阳');
  const nextHasMoon = hasStar(next, '太阴');
  const ok = (prevHasSun && nextHasMoon) || (prevHasMoon && nextHasSun);
  if (!ok) return;

  const sunPalace = prevHasSun ? prev : next;
  const moonPalace = prevHasMoon ? prev : next;
  const required = ['Thái Dương, Thái Âm ở hai cung trước và sau cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sunPalace, '太阳')) bonus.push('Thái Dương Miếu Vượng');
  if (isBright(moonPalace, '太阴')) bonus.push('Thái Âm Miếu Vượng');
  if (isDim(sunPalace, '太阳') || isDim(moonPalace, '太阴')) breaking.push('Nhật Nguyệt hãm địa (giáp Mệnh mà không có ánh sáng)');

  patterns.push({
    id: '日月夹命',
    name: 'Nhật Nguyệt giáp Mệnh',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thái Dương, Thái Âm ở hai bên cung Mệnh giáp chiếu, quang minh lỗi lạc, cả đời có quý nhân giúp đỡ, sự nghiệp phát triển mạnh. Nam chủ quan quý, nữ chủ vượng phu hưng gia. Nhật Nguyệt phải không hãm địa mới là chân giáp.',
    palaces: [sunPalace.name, moonPalace.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·日月夹命》 (Tử Vi Đẩu Số Toàn Thư – Nhật Nguyệt giáp Mệnh)',
  });
}

/** 巨日同宫：巨门太阳同入寅或申 */
function detectJuRiTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const ju = findStarPalace(chart, '巨门');
  const sun = findStarPalace(chart, '太阳');
  if (!ju || !sun || ju.branch !== sun.branch) return;
  if (ju.branch !== 2 && ju.branch !== 8) return;  // 必须寅(2) 或 申(8)

  const inMing = ju.branch === chart.mingGongBranch;
  const required = [`Cự Môn, Thái Dương cùng nhập cung ${viTerm(BRANCH_NAMES[ju.branch])}`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (ju.branch === 2) bonus.push('Thái Dương Miếu Vượng tại Dần, Cự Môn được ánh dương hóa giải thị phi');
  if (getStarSiHua(ju, '巨门') === '禄' || getStarSiHua(ju, '巨门') === '权') bonus.push('Cự Môn Hóa Lộc/Hóa Quyền (nhờ tài ăn nói mà sinh tài)');
  if (getStarSiHua(ju, '巨门') === '忌') breaking.push('Cự Môn Hóa Kỵ (khẩu thiệt, kiện tụng)');
  if (ju.branch === 8) breaking.push('Tại Thân, Thái Dương đã ngả về tây, ám tinh Cự Môn càng lộ rõ');

  patterns.push({
    id: '巨日同宫',
    name: 'Cự Nhật đồng cung',
    level: breaking.length ? 'caution' : (inMing && ju.branch === 2 ? 'excellent' : 'good'),
    description: `Cự Môn, Thái Dương đồng cung tại ${viTerm(BRANCH_NAMES[ju.branch])}, Thái Dương hóa giải ám tinh Cự Môn, chủ lập nghiệp nhờ tài ăn nói, truyền thông, ngoại ngữ, chuyên môn. Ở Dần là tốt, ở Thân lực giảm. Sợ Cự Môn Hóa Kỵ thì vướng kiện tụng.`,
    palaces: [ju.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·巨日同宫》 (Tử Vi Đẩu Số Toàn Thư – Cự Nhật đồng cung)',
  });
}

/** 石中隐玉：巨门入命于子午宫 */
function detectShiZhongYinYu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '巨门')) return;
  if (ming.branch !== 0 && ming.branch !== 6) return;  // 子(0) 或 午(6)

  const required = [`Cự Môn nhập Mệnh tại cung ${viTerm(BRANCH_NAMES[ming.branch])}`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(ming, '巨门') === '禄' || getStarSiHua(ming, '巨门') === '权') bonus.push('Cự Môn Hóa Lộc/Hóa Quyền');
  if (sanFangAllStars(chart).has('文昌')) bonus.push('Văn Xương hội chiếu (ngọc trong đá được soi sáng)');
  if (getStarSiHua(ming, '巨门') === '忌') breaking.push('Cự Môn Hóa Kỵ (ngọc vùi sâu trong bùn)');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Mệnh có sát tinh tọa thủ');

  patterns.push({
    id: '石中隐玉',
    name: 'Thạch trung ẩn ngọc',
    level: breaking.length ? 'caution' : 'excellent',
    description: 'Cự Môn tọa Mệnh tại Tý hoặc Ngọ, bề ngoài bình thường mà bên trong ẩn chứa tài học. Thời trẻ âm thầm không tiếng tăm, đến trung niên mới lộ quý khí; hợp con đường chuyên môn, nghiên cứu, ăn nói, truyền thông. Cần có Lộc, Quyền hoặc Văn Xương trợ giúp mới "đục đá thấy ngọc".',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数骨髓赋·石中隐玉》 (Tử Vi Đẩu Số Cốt Tủy Phú – Thạch trung ẩn ngọc)',
  });
}

/** 明珠出海：命宫在未空宫，对宫丑宫为太阳太阴 */
function detectMingZhuChuHai(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 7) return;   // 命在未
  if (getMajorStarNames(ming).length > 0) return;   // 命宫为空宫
  const dui = getDuiGong(chart, ming.branch);
  if (!dui) return;
  if (!hasStar(dui, '太阳') || !hasStar(dui, '太阴')) return;

  const required = ['Cung Mệnh tại Mùi, vô chính diệu', 'Cung đối (Sửu) có Thái Dương, Thái Âm đồng độ'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌') || sanFangAllStars(chart).has('文曲')) bonus.push('Gặp thêm Xương Khúc');
  if (sanFangAllStars(chart).has('左辅') || sanFangAllStars(chart).has('右弼')) bonus.push('Tả Hữu tương trợ');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Sát tinh hội chiếu (ánh ngọc lu mờ)');

  patterns.push({
    id: '明珠出海',
    name: 'Minh châu xuất hải',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Mệnh tại Mùi vô chính diệu, cung đối Sửu có Nhật Nguyệt cùng sáng chiếu về, gọi là "Minh châu xuất hải" (ngọc sáng ra biển). Chủ xuất thân bình thường, nhờ nỗ lực về sau mà nổi bật; hợp đi xa lập nghiệp nơi đất khách, nghiên cứu học thuật hoặc vị trí cao ở công ty lớn, chủ đại phú đại quý.',
    palaces: ['命宫', dui.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全集·明珠出海》 (Tử Vi Đẩu Số Toàn Tập – Minh châu xuất hải)',
  });
}

/** 紫微独坐入命 */
function detectZiWeiInMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微') || hasStar(ming, '天府')) return;

  const required = ['Tử Vi độc tọa cung Mệnh (không có Thiên Phủ đồng tọa)'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Tả Phù, Hữu Bật đồng hội');
  if (sanFangSet.has('文昌') && sanFangSet.has('文曲')) bonus.push('Văn Xương, Văn Khúc đồng hội');
  if (!sanFangSet.has('左辅') && !sanFangSet.has('右弼')) breaking.push('Không có Tả Hữu (vua cô độc không bề tôi)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Tử Vi gặp Không Kiếp (sách xưa kỵ nhất)');

  patterns.push({
    id: '紫微入命',
    name: 'Tử Vi nhập Mệnh',
    level: breaking.length ? 'caution' : (bonus.length ? 'excellent' : 'good'),
    description: 'Tử Vi độc tọa cung Mệnh, là sao đế vương, lòng tự tôn cao, có sức hút lãnh đạo. Nhưng Tử Vi kỵ nhất cảnh "在野孤君" (vua cô độc nơi đồng nội) — nếu không có Tả Phù, Hữu Bật hội về thì lại thành cô cao tự phụ, dễ chuốc lời gièm pha.',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 辅弼夹命 */
function detectFuBiJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasZuo = hasStar(prev, '左辅');
  const prevHasYou = hasStar(prev, '右弼');
  const nextHasZuo = hasStar(next, '左辅');
  const nextHasYou = hasStar(next, '右弼');
  if (!((prevHasZuo && nextHasYou) || (prevHasYou && nextHasZuo))) return;

  const required = ['Tả Phù, Hữu Bật ở hai cung trước và sau cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天钺')) bonus.push('Gặp thêm Khôi Việt');

  patterns.push({
    id: '辅弼夹命',
    name: 'Tả Hữu giáp Mệnh',
    level: 'excellent',
    description: 'Tả Phù, Hữu Bật giáp Mệnh; luận thuật truyền thống cho rằng cách này tượng trưng cho quý nhân trợ giúp và phúc dày. Hợp con đường quan trường, quản lý doanh nghiệp lớn… những hướng phát huy được tài tổ chức. Sách xưa viết "左辅右弼，终身福厚" (Tả Phù Hữu Bật, trọn đời phúc dày) — nhấn mạnh ưu thế của cách này trong tổ chức, điều phối.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗数全书·辅弼夹命》 (Tử Vi Đẩu Số Toàn Thư – Tả Hữu giáp Mệnh)',
  });
}

/** 昌曲夹命 */
function detectChangQuJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasChang = hasStar(prev, '文昌');
  const prevHasQu = hasStar(prev, '文曲');
  const nextHasChang = hasStar(next, '文昌');
  const nextHasQu = hasStar(next, '文曲');
  if (!((prevHasChang && nextHasQu) || (prevHasQu && nextHasChang))) return;

  patterns.push({
    id: '昌曲夹命',
    name: 'Xương Khúc giáp Mệnh',
    level: 'excellent',
    description: 'Văn Xương, Văn Khúc giáp cung Mệnh, chủ thông minh tuấn tú, văn chương xuất sắc, hợp giáo dục, học thuật, nghệ thuật, viết lách. Sách xưa viết "昌曲夹命主科甲" (Xương Khúc giáp Mệnh chủ đỗ đạt khoa bảng), lợi nhất cho vận thi cử.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Văn Xương, Văn Khúc ở hai cung trước và sau cung Mệnh'] },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 魁钺夹命 */
function detectKuiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '天魁') && hasStar(next, '天钺');
  const okB = hasStar(prev, '天钺') && hasStar(next, '天魁');
  if (!okA && !okB) return;

  patterns.push({
    id: '魁钺夹命',
    name: 'Khôi Việt giáp Mệnh',
    level: 'good',
    description: 'Thiên Khôi, Thiên Việt giáp Mệnh, nam gọi là Thiên Ất, nữ gọi là Ngọc Đường, cả đời có quý nhân nâng đỡ. Khi thi cử, tìm việc, vào thời khắc then chốt thường có quý nhân bất ngờ giúp đỡ.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Thiên Khôi, Thiên Việt ở hai cung trước và sau cung Mệnh'] },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 双禄朝垣：化禄 + 禄存 同会三方 */
function detectShuangLuChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFang = getSanFangPalaces(chart);
  let huaLuFound = false;
  let luCunFound = false;
  for (const p of sanFang) {
    if (p.stars.some(s => s.siHua === '禄')) huaLuFound = true;
    if (hasStar(p, '禄存')) luCunFound = true;
  }
  if (!huaLuFound || !luCunFound) return;

  patterns.push({
    id: '双禄朝垣',
    name: 'Song Lộc triều viên',
    level: 'excellent',
    description: 'Hóa Lộc, Lộc Tồn cùng hội tam phương tứ chính cung Mệnh, nguồn tài dồi dào, cơm áo đầy đủ. Sách xưa viết "双禄朝垣，富比陶朱" (Song Lộc triều viên, giàu sánh Đào Chu), chủ cả đời không lo tiền bạc, thường có cả chính tài lẫn hoạnh tài.',
    palaces: sanFang.map(p => p.name),
    conditions: {
      required: ['Hóa Lộc hội chiếu tam phương tứ chính', 'Lộc Tồn hội chiếu tam phương tứ chính'],
      breaking: hasShaInPalace(ming, SHA_KONG) ? ['Mệnh có Không Kiếp tọa thủ (Song Lộc gặp Không, tiền đến rồi đi)'] : undefined,
    },
    source: '《紫微斗数全书·双禄朝垣》 (Tử Vi Đẩu Số Toàn Thư – Song Lộc triều viên)',
  });
}

/** 三奇加会：化禄 化权 化科 同会三方 */
function detectSanQiJiaHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangPalaces = getSanFangPalaces(chart);
  let lu = false, quan = false, ke = false;
  for (const p of sanFangPalaces) {
    for (const s of p.stars) {
      if (s.siHua === '禄') lu = true;
      if (s.siHua === '权') quan = true;
      if (s.siHua === '科') ke = true;
    }
  }
  if (!(lu && quan && ke)) return;

  patterns.push({
    id: '三奇加会',
    name: 'Tam Kỳ gia hội',
    level: 'excellent',
    description: 'Ba cát hóa Hóa Lộc, Hóa Quyền, Hóa Khoa cùng hội tam phương tứ chính cung Mệnh, gọi là "Tam Kỳ gia hội". Chủ cả đời công danh, tiền tài, quý nhân đều đủ cả ba, là một trong những cát cách cao nhất của Tử Vi Đẩu Số.',
    palaces: sanFangPalaces.map(p => p.name),
    conditions: { required: ['Ba cát hóa Hóa Lộc, Hóa Quyền, Hóa Khoa cùng hội tam phương tứ chính cung Mệnh'] },
    source: '《紫微斗数全书·三奇加会》 (Tử Vi Đẩu Số Toàn Thư – Tam Kỳ gia hội)',
  });
}

/** 化禄入命/官/财 */
function detectHuaLuRuMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const huaLuStar = ming.stars.find(s => s.siHua === '禄' && s.type === 'major');
  if (!huaLuStar) return;

  patterns.push({
    id: `${huaLuStar.name}化禄入命`,
    name: `${viTerm(huaLuStar.name)} Hóa Lộc nhập Mệnh`,
    level: 'good',
    description: `${viTerm(huaLuStar.name)} Hóa Lộc tọa Mệnh, chủ kiếm tiền thuận lợi, được lòng người, nhiều cơ duyên.${huaLuStar.name === '武曲' ? ' Vũ Khúc Hóa Lộc thuộc chính tài, hợp thực nghiệp, tài chính.' : huaLuStar.name === '太阴' ? ' Thái Âm Hóa Lộc thuộc âm tài, bất động sản.' : huaLuStar.name === '贪狼' ? ' Tham Lang Hóa Lộc thuộc tài từ quan hệ, tài đào hoa.' : ''}`,
    palaces: ['命宫'],
    conditions: { required: [`${viTerm(huaLuStar.name)} Hóa Lộc tọa cung Mệnh`] },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

// ────────────────── 恶格识别器 ──────────────────

/** 化忌入命/迁 */
function detectHuaJiRuMingQian(chart: ZiweiChart, patterns: Pattern[]) {
  const qianBranch = (chart.mingGongBranch + 6) % 12;
  for (const palace of chart.palaces) {
    if (palace.branch !== chart.mingGongBranch && palace.branch !== qianBranch) continue;
    const jiStar = palace.stars.find(s => s.siHua === '忌' && s.type === 'major');
    if (!jiStar) continue;

    const inMing = palace.branch === chart.mingGongBranch;
    patterns.push({
      id: `${jiStar.name}化忌入${inMing ? '命' : '迁'}`,
      name: `${viTerm(jiStar.name)} Hóa Kỵ nhập ${inMing ? 'Mệnh' : 'Thiên Di'}`,
      level: 'caution',
      description: inMing
        ? `${viTerm(jiStar.name)} Hóa Kỵ tọa cung Mệnh, cần lưu ý sự cố chấp, vướng mắc tâm lý hoặc mầm bệnh tiềm ẩn của bản thân, việc gì cũng nên lùi một bước mà suy xét. Hóa Kỵ không hẳn là xấu, nó cho thấy năng lượng của sao này cần được đặc biệt chú ý.`
        : `${viTerm(jiStar.name)} Hóa Kỵ tọa cung Thiên Di, ra ngoài, đi xa, quan hệ giao tiếp dễ gặp trắc trở, nên giữ hơn là động.`,
      palaces: [palace.name],
      conditions: { required: [`${viTerm(jiStar.name)} Hóa Kỵ tọa cung ${inMing ? 'Mệnh' : 'Thiên Di'}`] },
      source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
    });
  }
}

/** 羊陀夹忌：化忌坐宫，左右被擎羊陀罗夹 */
function detectYangTuoJiaJi(chart: ZiweiChart, patterns: Pattern[]) {
  for (const palace of chart.palaces) {
    const jiStar = palace.stars.find(s => s.siHua === '忌');
    if (!jiStar) continue;
    if (palace.branch !== chart.mingGongBranch) continue;   // 只看命宫被夹

    const { prev, next } = getJiaPalaces(chart, palace.branch);
    if (!prev || !next) continue;
    const aPrev = hasStar(prev, '擎羊') && hasStar(next, '陀罗');
    const aNext = hasStar(prev, '陀罗') && hasStar(next, '擎羊');
    if (!aPrev && !aNext) continue;

    patterns.push({
      id: '羊陀夹忌',
      name: 'Kình Đà giáp Kỵ',
      level: 'caution',
      description: 'Hóa Kỵ tọa Mệnh, hai bên có Kình Dương, Đà La giáp Mệnh. Sách xưa viết "羊陀夹忌为败局" (Kình Đà giáp Kỵ là cục thất bại), chủ cả đời bôn ba vất vả, lận đận không thuận, thân tâm mỏi mệt. Cần hóa giải bằng tu dưỡng đức hạnh và tích cực làm việc, việc gì cũng nên thận trọng.',
      palaces: ['命宫', prev.name, next.name],
      conditions: { required: ['Hóa Kỵ tọa Mệnh', 'Kình Dương, Đà La ở hai cung trước và sau cung Mệnh'] },
      source: '《紫微斗数骨髓赋·羊陀夹忌》 (Tử Vi Đẩu Số Cốt Tủy Phú – Kình Đà giáp Kỵ)',
    });
    return;
  }
}

/** 火铃夹命：火星铃星分居命宫前后 */
function detectHuoLingJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '火星') && hasStar(next, '铃星');
  const okB = hasStar(prev, '铃星') && hasStar(next, '火星');
  if (!okA && !okB) return;

  patterns.push({
    id: '火铃夹命',
    name: 'Hỏa Linh giáp Mệnh',
    level: 'caution',
    description: 'Hỏa Tinh, Linh Tinh ở hai cung trước và sau giáp cung Mệnh, chủ tính nóng, dễ bốc đồng, dễ gặp sự cố hoặc tranh chấp bất ngờ. Cần rèn tính kiên nhẫn, tránh quyết định bốc đồng.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Hỏa Tinh, Linh Tinh ở hai cung trước và sau cung Mệnh'] },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 空劫夹命：地空地劫分居命宫前后 */
function detectKongJieJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '地空') && hasStar(next, '地劫');
  const okB = hasStar(prev, '地劫') && hasStar(next, '地空');
  if (!okA && !okB) return;

  patterns.push({
    id: '空劫夹命',
    name: 'Không Kiếp giáp Mệnh',
    level: 'caution',
    description: 'Địa Không, Địa Kiếp giáp Mệnh, chủ tiền đến rồi đi, tư tưởng thoát tục, dễ tìm về tôn giáo, triết học. Sách xưa viết "空劫夹命，财不聚" (Không Kiếp giáp Mệnh, tiền không tụ). Hợp các nghề không nặng vật chất như kỹ nghệ, tôn giáo, nghiên cứu.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Địa Không, Địa Kiếp ở hai cung trước và sau cung Mệnh'] },
    source: '《紫微斗数全书》 (Tử Vi Đẩu Số Toàn Thư)',
  });
}

/** 廉杀羊：廉贞、七杀、擎羊三星会照（流年大限最凶） */
function detectLianShaYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('廉贞') && sanFangSet.has('七杀') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    id: '廉杀羊',
    name: 'Liêm Sát Dương',
    level: 'caution',
    description: 'Ba sao Liêm Trinh, Thất Sát, Kình Dương hội chiếu tam phương cung Mệnh; luận thuật truyền thống xếp đây là tổ hợp cần đặc biệt lưu ý. Khi cách này được kích hoạt trong Đại Hạn, Lưu Niên, hãy giữ thái độ thận trọng: lái xe an toàn, hòa khí trong giao tiếp, quyết định y tế cần lý trí — nhấn mạnh chủ động quản lý chứ không tiêu cực phó mặc số phận.',
    palaces: ['命宫'],
    conditions: { required: ['Ba sao Liêm Trinh, Thất Sát, Kình Dương hội chiếu tam phương tứ chính'] },
    source: '《紫微斗数全书·廉杀羊》 (Tử Vi Đẩu Số Toàn Thư – Liêm Sát Dương)',
  });
}

/** 巨火羊：巨门、火星、擎羊会照 */
function detectJuHuoYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('巨门') && sanFangSet.has('火星') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    id: '巨火羊',
    name: 'Cự Hỏa Dương',
    level: 'caution',
    description: 'Ba sao Cự Môn, Hỏa Tinh, Kình Dương hội chiếu; cổ thư ghi đây là tổ hợp cần cảnh giác (câu cổ văn "终身缢死" – chung thân ải tử – là cách nói định mệnh luận, ngày nay không còn phù hợp). Cách hiểu hiện đại: tổ hợp này tượng trưng cho việc nói thẳng dễ gây xung đột, khi cảm xúc dâng cao cần tự nhận biết. Hướng tu dưỡng: tập diễn đạt ôn hòa, chủ động hóa giải đối lập, rèn khả năng quản lý cảm xúc.',
    palaces: ['命宫'],
    conditions: { required: ['Ba sao Cự Môn, Hỏa Tinh, Kình Dương hội chiếu tam phương tứ chính'] },
    source: '《紫微斗数骨髓赋·巨火羊》 (Tử Vi Đẩu Số Cốt Tủy Phú – Cự Hỏa Dương)',
  });
}

/** 铃昌陀武：铃星、文昌、陀罗、武曲会照（限至投河） */
function detectLingChangTuoWu(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('铃星') && sanFangSet.has('文昌') && sanFangSet.has('陀罗') && sanFangSet.has('武曲'))) return;

  patterns.push({
    id: '铃昌陀武',
    name: 'Linh Xương Đà Vũ',
    level: 'caution',
    description: 'Bốn sao Linh Tinh, Văn Xương, Đà La, Vũ Khúc cùng hội; cổ thư ghi đây là tổ hợp cần đặc biệt lưu ý (câu cổ văn "限至投河" – hạn đến gieo mình xuống sông – là cách nói định mệnh luận, không phải cách hiểu hiện đại). Lời khuyên hiện đại: khi tổ hợp này được kích hoạt trong Đại Hạn, Lưu Niên, hãy xử lý các quyết định lớn một cách lý trí, để ý dao động cảm xúc, giữ cuộc sống ổn định — nhấn mạnh chủ động quản lý chứ không thụ động chờ đợi.',
    palaces: ['命宫'],
    conditions: { required: ['Bốn sao Linh Tinh, Văn Xương, Đà La, Vũ Khúc hội chiếu tam phương tứ chính'] },
    source: '《紫微斗数骨髓赋·铃昌陀武》 (Tử Vi Đẩu Số Cốt Tủy Phú – Linh Xương Đà Vũ)',
  });
}

/** 马头带箭：擎羊在午宫坐命 */
function detectMaTouDaiJian(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 6) return;   // 必须午
  if (!hasStar(ming, '擎羊')) return;

  const required = ['Kình Dương tọa Mệnh tại Ngọ'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('七杀') || sanFangAllStars(chart).has('破军')) bonus.push('Gặp thêm Thất Sát hoặc Phá Quân (đại quý về võ nghiệp)');
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天钺')) bonus.push('Khôi Việt gia chiếu');

  patterns.push({
    id: '马头带箭',
    name: 'Mã đầu đới tiễn',
    level: bonus.length ? 'good' : 'caution',
    description: 'Kình Dương tọa Mệnh tại Ngọ, gọi là "Mã đầu đới tiễn" (đầu ngựa mang tên), sách xưa viết "威镇边疆" (uy trấn biên cương). Cách này tượng trưng cho hành động quả quyết và tinh thần cạnh tranh, hợp những nghề cần năng lực thực thi và quyết đoán. Luận thuật truyền thống đồng thời nhắc rằng cách này cần cát tinh phối hợp mới phát huy tốt nhất — nhấn mạnh ảnh hưởng của tổ hợp chứ không luận riêng một sao.',
    palaces: ['命宫'],
    conditions: { required, bonus },
    source: '《紫微斗数骨髓赋·马头带箭》 (Tử Vi Đẩu Số Cốt Tủy Phú – Mã đầu đới tiễn)',
  });
}

// ────────────────── 基础格局（提升识别覆盖率）──────────────────
// 设计：让普通命盘也能识别出 1-3 个常见格局，而不是 30+ 严格古书格局都不匹配。
// 这些都是单一条件触发的轻量识别，level 多为 neutral / good。

/** 禄存守身：禄存入身宫（或命宫与身宫同宫） */
function detectLuCunShouShen(chart: ZiweiChart, patterns: Pattern[]) {
  const luCunPalace = findStarPalace(chart, '禄存');
  if (!luCunPalace) return;
  const inMing = luCunPalace.branch === chart.mingGongBranch;
  const inShen = luCunPalace.branch === chart.shenGongBranch;
  if (!inMing && !inShen) return;
  patterns.push({
    id: inMing ? '禄存守命' : '禄存守身',
    name: inMing ? 'Lộc Tồn thủ Mệnh' : 'Lộc Tồn thủ Thân',
    level: 'good',
    description: inMing
      ? 'Lộc Tồn tọa Mệnh, chủ cả đời cơm áo không lo, tài lộc ổn định. Tính cách bảo thủ, giỏi tích lũy, nhưng Kình Đà giáp Lộc nên phải đề phòng tiểu nhân. Tốt nhất có thêm Hóa Lộc, Tả Phù, Hữu Bật mới thành đại cách.'
      : 'Lộc Tồn nhập cung Thân, chủ sau trung niên nguồn tài ổn định, có lộc tự hưởng. Thầy Nghê nói「禄存入身，财气近身」(Lộc Tồn nhập Thân, tài khí kề thân) — người phối ngẫu hoặc hướng sự nghiệp có thể mang lại tài lộc ổn định.',
    palaces: [inMing ? '命宫' : '身宫'],
    conditions: { required: [inMing ? 'Lộc Tồn nhập cung Mệnh' : 'Lộc Tồn nhập cung Thân'] },
    source: '《紫微斗数全书·禄存星》 (Tử Vi Đẩu Số Toàn Thư – sao Lộc Tồn)',
  });
}

/** 天马入命/迁：驿马星动 */
function detectTianMaRuMing(chart: ZiweiChart, patterns: Pattern[]) {
  const tianMaPalace = findStarPalace(chart, '天马');
  if (!tianMaPalace) return;
  const inMing = tianMaPalace.branch === chart.mingGongBranch;
  const inQian = tianMaPalace.branch === ((chart.mingGongBranch + 6) % 12);
  if (!inMing && !inQian) return;
  patterns.push({
    id: inMing ? '天马入命' : '天马在迁',
    name: inMing ? 'Thiên Mã nhập Mệnh' : 'Thiên Mã tại Thiên Di',
    level: 'neutral',
    description: inMing
      ? 'Thiên Mã tọa Mệnh, chủ cả đời bôn ba, trong động mà được tài, hợp buôn bán đi xa, công việc bên ngoài, phát triển đa lĩnh vực. Thầy Nghê nói「天马入命，无禄不发」(Thiên Mã nhập Mệnh, không có Lộc thì không phát) — nếu hội thêm Lộc Tồn hoặc Hóa Lộc thì thành phú cách「禄马交驰」(Lộc Mã giao trì).'
      : 'Thiên Mã ở cung Thiên Di, chủ ra ngoài có lợi, đi xa được tài, hợp phát triển nơi đất khách. Đi cùng Hóa Lộc chủ sinh tài nơi xứ người, đi cùng sát tinh thì đường đi nhiều trắc trở.',
    palaces: [tianMaPalace.name],
    conditions: { required: [inMing ? 'Thiên Mã nhập cung Mệnh' : 'Thiên Mã nhập cung Thiên Di'] },
    source: '《紫微斗数全书·天马星》 (Tử Vi Đẩu Số Toàn Thư – sao Thiên Mã)',
  });
}

/** 化禄入财：财帛宫主星化禄 */
function detectHuaLuRuCai(chart: ZiweiChart, patterns: Pattern[]) {
  const cai = chart.palaces.find(p => p.name === '财帛');
  if (!cai) return;
  const luStar = cai.stars.find(s => s.type === 'major' && s.siHua === '禄');
  if (!luStar) return;
  patterns.push({
    id: '化禄入财',
    name: 'Hóa Lộc nhập Tài Bạch',
    level: 'good',
    description: `${viTerm(luStar.name)} Hóa Lộc nhập cung Tài Bạch, chủ nguồn tài thông suốt, thu nhập ổn định. Thầy Nghê (Nghê Hải Hạ) giảng Hóa Lộc là biểu tượng của「chính tài」— năng lực mà sao Hóa Lộc này đại diện (đặc chất cốt lõi của ${viTerm(luStar.name)}) chính là trục kiếm tiền của bạn. Đi cùng Lộc Tồn hoặc Thiên Mã thì nguồn tài càng rộng.`,
    palaces: ['财帛'],
    conditions: { required: [`${viTerm(luStar.name)} Hóa Lộc nhập cung Tài Bạch`] },
    source: '《紫微斗数全书·四化论》 (Tử Vi Đẩu Số Toàn Thư – luận Tứ Hóa)',
  });
}

/** 化权入官：官禄宫主星化权 */
function detectHuaQuanRuGuan(chart: ZiweiChart, patterns: Pattern[]) {
  const guan = chart.palaces.find(p => p.name === '官禄');
  if (!guan) return;
  const quanStar = guan.stars.find(s => s.type === 'major' && s.siHua === '权');
  if (!quanStar) return;
  patterns.push({
    id: '化权入官',
    name: 'Hóa Quyền nhập Quan Lộc',
    level: 'good',
    description: `${viTerm(quanStar.name)} Hóa Quyền nhập cung Quan Lộc, chủ sự nghiệp có khả năng nắm quyền kiểm soát, đảm đương được vị trí tự mình gánh vác một mảng. Hóa Quyền đại diện cho quyền lực và năng lực thực thi — ${viTerm(quanStar.name)} Hóa Quyền cho thấy trong sự nghiệp bạn có thể trở thành người ra quyết định hoặc người thực thi chủ chốt, nên đi theo hướng quản lý hoặc chuyên gia kỹ thuật có uy tín.`,
    palaces: ['官禄'],
    conditions: { required: [`${viTerm(quanStar.name)} Hóa Quyền nhập cung Quan Lộc`] },
    source: '《紫微斗数全书·四化论》 (Tử Vi Đẩu Số Toàn Thư – luận Tứ Hóa)',
  });
}

/** 化科入命/身：科名加身 */
function detectHuaKeRuMingShen(chart: ZiweiChart, patterns: Pattern[]) {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const target = [ming, shen].filter((p): p is Palace => Boolean(p));
  for (const p of target) {
    const keStar = p.stars.find(s => s.type === 'major' && s.siHua === '科');
    if (!keStar) continue;
    const isMing = p.branch === chart.mingGongBranch;
    patterns.push({
      id: isMing ? '化科入命' : '化科入身',
      name: isMing ? 'Hóa Khoa nhập Mệnh' : 'Hóa Khoa nhập Thân',
      level: 'good',
      description: `${viTerm(keStar.name)} Hóa Khoa nhập cung ${isMing ? 'Mệnh' : 'Thân'}, chủ vận về danh tiếng, văn thư, học thuật. Thầy Nghê giảng Hóa Khoa là「sao quý nhân」— ${viTerm(keStar.name)} Hóa Khoa mang lại phẩm chất được người khác coi trọng, nên làm văn thư, giáo dục, nghiên cứu, tư vấn, sáng tạo văn hóa… theo hướng “dùng danh để cầu lợi”.`,
      palaces: [isMing ? '命宫' : '身宫'],
      conditions: { required: [`${viTerm(keStar.name)} Hóa Khoa nhập cung ${isMing ? 'Mệnh' : 'Thân'}`] },
      source: '《紫微斗数全书·四化论》 (Tử Vi Đẩu Số Toàn Thư – luận Tứ Hóa)',
    });
    return; // 命和身重复时只识别一次
  }
}

/** 机月同梁三星会（3 星不全格，非四星真格）：天机/太阴/天同/天梁 任 3 星齐入三方四正 */
function detectJiYueTongLiangPartial(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天机', '太阴', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length !== 3) return; // 4 星齐由 detectJiYueTongLiang 处理
  // 避免和上面 detectJiYueTongLiang 重复（4 星齐的不进这里）
  const missing = ['天机', '太阴', '天同', '天梁'].filter(s => !sanFangSet.has(s));
  patterns.push({
    id: '机月同梁三星会',
    name: 'Cơ Nguyệt Đồng Lương (hội ba sao)',
    level: 'neutral',
    description: `Cơ Nguyệt Đồng Lương cần đủ bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng hội tam phương tứ chính mới là chân cách trọn vẹn; lá số này chỉ hội được 3 sao (${has.map(viTerm).join(', ')}), thiếu ${missing.map(viTerm).join(', ')}, nên không phải chân cách trọn vẹn, lực giảm một bậc. Văn nhã mà có mưu lược, hợp công chức, giảng dạy – nghiên cứu, y tế, dịch vụ… những ngành dựa vào tích lũy và ổn định; mấu chốt là xem sao còn thiếu phối hợp với Tứ Hóa ra sao.`,
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required: [`Tam phương tứ chính hội ${has.map(viTerm).join(', ')} (Cơ Nguyệt Đồng Lương thiếu ${missing.map(viTerm).join(', ')})`] },
    source: '《紫微斗数全书·机月同梁格》 (Tử Vi Đẩu Số Toàn Thư – Cơ Nguyệt Đồng Lương cách)',
  });
  void ming;
}

/** 昌曲同会：文昌+文曲都在命三方四正 */
function detectChangQuTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('文昌') || !sanFangSet.has('文曲')) return;
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return;
  const inMing = hasStar(ming, '文昌') && hasStar(ming, '文曲');
  patterns.push({
    id: inMing ? '昌曲坐命' : '昌曲同会',
    name: inMing ? 'Xương Khúc tọa Mệnh' : 'Xương Khúc đồng hội',
    level: 'good',
    description: inMing
      ? 'Văn Xương, Văn Khúc cùng nhập cung Mệnh, chủ thông minh tuấn tú, văn chương xuất sắc, hợp văn học, giáo dục, viết lách, tư vấn. Kỵ nhất Hóa Kỵ — Xương Khúc Hóa Kỵ chủ thiệt ngầm về giấy tờ, hợp đồng.'
      : 'Văn Xương, Văn Khúc đồng hội tam phương tứ chính, chủ tài hoa dồi dào, ăn nói và văn chương đều giỏi. Hợp những ngành cần khả năng diễn đạt và văn tài; có Hóa Khoa trợ lực thì danh tiếng hiển hách.',
    palaces: ['命宫'],
    conditions: { required: ['Văn Xương, Văn Khúc đồng hội tam phương tứ chính cung Mệnh'] },
    source: '《紫微斗数全书·文星论》 (Tử Vi Đẩu Số Toàn Thư – luận văn tinh)',
  });
}

/** 辅弼同会：左辅+右弼都在命三方四正 */
function detectFuBiTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('左辅') || !sanFangSet.has('右弼')) return;
  patterns.push({
    id: '辅弼同会',
    name: 'Tả Hữu đồng hội',
    level: 'good',
    description: 'Tả Phù, Hữu Bật đồng hội tam phương tứ chính cung Mệnh, chủ cả đời quý nhân không dứt, nhân duyên cực tốt. Hợp nhất với vị trí lãnh đạo và công việc làm việc nhóm. Thầy Nghê nói「辅弼夹命，平生贵人多」(Tả Hữu giáp Mệnh, cả đời nhiều quý nhân) — bạn không phải mệnh đơn độc chiến đấu, hãy khéo dùng mạng lưới quan hệ.',
    palaces: ['命宫'],
    conditions: { required: ['Tả Phù, Hữu Bật đồng hội tam phương tứ chính cung Mệnh'] },
    source: '《紫微斗数全书·辅弼论》 (Tử Vi Đẩu Số Toàn Thư – luận Tả Hữu)',
  });
}

/** 魁钺同会：天魁+天钺都在命三方四正 */
function detectKuiYueTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('天魁') || !sanFangSet.has('天钺')) return;
  patterns.push({
    id: '魁钺同会',
    name: 'Khôi Việt đồng hội',
    level: 'good',
    description: 'Thiên Khôi, Thiên Việt đồng hội tam phương tứ chính cung Mệnh, chủ được "Thiên Ất quý nhân" phù trợ, vào thời khắc then chốt luôn có quý nhân nâng đỡ. Thầy Nghê nói「魁钺夹命，必为贵人」(Khôi Việt giáp Mệnh, ắt là quý nhân) — khi gặp khó khăn sẽ có người đắc lực giúp đỡ bên cạnh, nên chủ động vun đắp quan hệ.',
    palaces: ['命宫'],
    conditions: { required: ['Thiên Khôi, Thiên Việt đồng hội tam phương tứ chính cung Mệnh'] },
    source: '《紫微斗数全书·魁钺论》 (Tử Vi Đẩu Số Toàn Thư – luận Khôi Việt)',
  });
}

/** 科权双会：化科 + 化权 同会三方四正 */
function detectKeQuanShuangHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sfPalaces = getSanFangPalaces(chart);
  let hasKe = false, hasQuan = false;
  for (const p of sfPalaces) {
    for (const s of p.stars) {
      if (s.type === 'major' && s.siHua === '科') hasKe = true;
      if (s.type === 'major' && s.siHua === '权') hasQuan = true;
    }
  }
  if (!hasKe || !hasQuan) return;
  patterns.push({
    id: '科权双会',
    name: 'Khoa Quyền song hội',
    level: 'good',
    description: 'Hóa Khoa + Hóa Quyền đồng hội tam phương tứ chính, chủ danh và quyền đều đẹp — vừa có học thức/danh tiếng (Khoa), vừa có khả năng nắm quyền (Quyền); hợp con đường "chuyên gia có uy tín" (như bác sĩ, luật sư, giáo sư, trụ cột kỹ thuật), danh lợi đều được mà nền tảng vững chắc.',
    palaces: ['命宫'],
    conditions: { required: ['Hóa Khoa, Hóa Quyền đồng hội tam phương tứ chính cung Mệnh'] },
    source: '《紫微斗数全书·四化会照》 (Tử Vi Đẩu Số Toàn Thư – Tứ Hóa hội chiếu)',
  });
}

// ────────────────── 主入口 ──────────────────
export function detectPatterns(chart: ZiweiChart): Pattern[] {
  const patterns: Pattern[] = [];
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return patterns;

  // 上格
  detectJunChenQingHui(chart, ming, patterns);
  detectZiFu(chart, ming, patterns);
  detectFuXiangChaoYuan(chart, ming, patterns);
  detectYangLiangChangLu(chart, ming, patterns);
  detectHuoTanLingTan(chart, ming, patterns);
  detectWuTan(chart, ming, patterns);
  detectShaPoLang(chart, ming, patterns);
  detectJiYueTongLiang(chart, ming, patterns);

  // 中格
  detectLianXiang(chart, patterns);
  detectWuQiSha(chart, patterns);
  detectTongLiang(chart, patterns);
  detectRiYueTongGong(chart, patterns);
  detectRiYueJiaMing(chart, patterns);
  detectJuRiTongGong(chart, patterns);
  detectShiZhongYinYu(chart, ming, patterns);
  detectMingZhuChuHai(chart, ming, patterns);
  detectZiWeiInMing(chart, ming, patterns);

  // 助力格
  detectFuBiJiaMing(chart, patterns);
  detectChangQuJiaMing(chart, patterns);
  detectKuiYueJiaMing(chart, patterns);
  detectShuangLuChaoYuan(chart, ming, patterns);
  detectSanQiJiaHui(chart, patterns);
  detectHuaLuRuMing(chart, ming, patterns);

  // 恶格
  detectHuaJiRuMingQian(chart, patterns);
  detectYangTuoJiaJi(chart, patterns);
  detectHuoLingJiaMing(chart, patterns);
  detectKongJieJiaMing(chart, patterns);
  detectLianShaYang(chart, patterns);
  detectJuHuoYang(chart, patterns);
  detectLingChangTuoWu(chart, patterns);
  detectMaTouDaiJian(chart, ming, patterns);

  // 基础格局（提升识别覆盖率，让普通命盘也能识别 1-3 个）
  detectLuCunShouShen(chart, patterns);
  detectTianMaRuMing(chart, patterns);
  detectHuaLuRuCai(chart, patterns);
  detectHuaQuanRuGuan(chart, patterns);
  detectHuaKeRuMingShen(chart, patterns);
  detectJiYueTongLiangPartial(chart, ming, patterns);
  detectChangQuTongHui(chart, patterns);
  detectFuBiTongHui(chart, patterns);
  detectKuiYueTongHui(chart, patterns);
  detectKeQuanShuangHui(chart, patterns);

  return patterns;
}

// ────────────────── 命宫摘要（保持向后兼容）──────────────────
export function getMingGongSummary(chart: ZiweiChart): {
  stars: string[];
  keywords: string[];
  nature: string;
} {
  const mingPalace = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!mingPalace) return { stars: [], keywords: [], nature: '' };

  const majorStars = mingPalace.stars.filter(s => s.type === 'major');
  const starNames = majorStars.map(s => s.name);

  const keywordMap: Record<string, string[]> = {
    '紫微': ['Tôn quý', 'Độc lập', 'Lãnh đạo'],
    '天机': ['Trí tuệ', 'Linh hoạt', 'Giỏi mưu tính'],
    '太阳': ['Dương cương', 'Quan quý', 'Hào phóng'],
    '武曲': ['Giàu có', 'Cương nghị', 'Quả đoán'],
    '天同': ['Ôn hòa', 'Hưởng phúc', 'Tùy duyên'],
    '廉贞': ['Tài nghệ', 'Đào hoa', 'Đa biến'],
    '天府': ['Kho tài', 'Chín chắn', 'Bảo thủ'],
    '太阴': ['Nhu mỹ', 'Giàu có', 'Tinh tế'],
    '贪狼': ['Dục vọng', 'Đào hoa', 'Đa tài'],
    '巨门': ['Giỏi biện luận', 'Suy nghĩ nhiều', 'Tài ăn nói'],
    '天相': ['Phò tá', 'Hành chính', 'Vững vàng'],
    '天梁': ['Che chở', 'Y dược', 'Bề trên'],
    '七杀': ['Tướng tinh', 'Quả quyết', 'Cô khắc'],
    '破军': ['Khai sáng', 'Biến động', 'Phá cũ'],
  };

  const natureMap: Record<string, string> = {
    '紫微': 'Sao đế vương', '天机': 'Sao trí tuệ', '太阳': 'Sao quý nhân',
    '武曲': 'Sao tài bạch', '天同': 'Sao phúc đức', '廉贞': 'Sao đào hoa',
    '天府': 'Sao kho tài', '太阴': 'Sao phú quý', '贪狼': 'Sao đào hoa',
    '巨门': 'Sao thị phi', '天相': 'Sao ấn thụ', '天梁': 'Sao ấm tý',
    '七杀': 'Sao tướng soái', '破军': 'Sao biến động',
  };

  const keywords = starNames.flatMap(n => keywordMap[n] ?? []).slice(0, 5);
  const nature = starNames.length > 0 ? (natureMap[starNames[0]] ?? '') : 'Vô Chính Diệu';

  return { stars: starNames, keywords, nature };
}
