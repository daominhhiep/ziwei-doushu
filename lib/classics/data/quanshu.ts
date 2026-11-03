/**
 * 《紫微斗数全书》— 核心精选
 *
 * 公版（明代罗洪先编）
 * 是紫微斗数最系统的古籍，强调宫位关系与四化，全本约 10 万字。
 */

import type { Book } from '../types';

export const ziWeiQuanShu: Book = {
  title: 'Tử Vi Đẩu Số Toàn Thư',
  titleZh: '紫微斗数全书',
  slug: 'quanshu',
  dynasty: 'Nhà Minh',
  author: 'La Hồng Tiên biên soạn',
  intro: 'Bộ cổ thư có hệ thống nhất của Tử Vi Đẩu Số, chú trọng quan hệ giữa mười hai cung và Tứ Hóa. Là giáo trình chính của giới học Tử Vi từ đời Thanh trở đi.',
  wordCount: 100000,
  chapters: [
    {
      title: 'Luận mười hai cung · Cung Mệnh',
      titleZh: '十二宫论·命宫',
      subtitle: 'Gốc rễ của việc xem mệnh',
      paragraphs: [
        {
          id: 'qs-1-1',
          idx: 1,
          text: '命宫者，一身之根本，万事之枢纽。命宫定，则一生格局定。看命宫先看主星，次看辅煞，再看四化与三方四正之会照。',
          translation: 'Cung Mệnh là gốc rễ của cả đời người, là then chốt của mọi việc. Cung Mệnh định thì cách cục cả đời định. Xem cung Mệnh trước hết xem chính tinh, kế đến xem phụ tinh và sát tinh, sau đó xem Tứ Hóa và sự hội chiếu của Tam Phương Tứ Chính.',
        },
        {
          id: 'qs-1-2',
          idx: 2,
          text: '命宫主星庙旺，主先天优势，做事事半功倍；落陷则主先天劣势，但反主大成——落陷之人有"不甘"二字推动，反能爆发出庙旺命格做不到的逆袭。',
          translation: 'Chính tinh cung Mệnh ở Miếu Vượng chủ có ưu thế bẩm sinh, làm việc một vốn bốn lời; rơi vào Hãm địa thì chủ bất lợi bẩm sinh, nhưng trái lại có thể thành tựu lớn — người Hãm địa được thúc đẩy bởi hai chữ "không cam", nên lại có thể bứt phá ngược dòng điều mà mệnh Miếu Vượng không làm được.',
        },
        {
          id: 'qs-1-3',
          idx: 3,
          text: '命宫见六吉星（左辅右弼文昌文曲天魁天钺），主一生贵人不绝；命宫见六煞星（擎羊陀罗火星铃星地空地劫），主多波折磨砺，但若能忍过，反成大器。',
          translation: 'Cung Mệnh gặp Lục Cát Tinh (Tả Phù, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi, Thiên Việt) chủ cả đời không thiếu quý nhân; cung Mệnh gặp Lục Sát Tinh (Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, Địa Không, Địa Kiếp) chủ nhiều trắc trở, tôi luyện, nhưng nếu nhẫn nại vượt qua thì trái lại thành đại khí.',
        },
      ],
    },
    {
      title: 'Luận mười hai cung · Cung Tài Bạch',
      titleZh: '十二宫论·财帛宫',
      subtitle: 'Nguồn tài lộc',
      paragraphs: [
        {
          id: 'qs-2-1',
          idx: 1,
          text: '财帛宫主一生之财源、收入、理财方式。财帛宫主星不同，赚钱方式各异：紫微在财主官财，武曲在财主商财，太阴在财主田宅财，巨门在财主口才财。',
          translation: 'Cung Tài Bạch chủ nguồn tiền, thu nhập và cách quản lý tài chính cả đời. Chính tinh cung Tài Bạch khác nhau thì cách kiếm tiền cũng khác: Tử Vi ở Tài chủ tiền từ quan chức, Vũ Khúc ở Tài chủ tiền từ buôn bán, Thái Âm ở Tài chủ tiền từ nhà đất, Cự Môn ở Tài chủ tiền nhờ tài ăn nói.',
        },
        {
          id: 'qs-2-2',
          idx: 2,
          text: '财帛宫化禄入命，主财源广进；财帛宫化忌，主财来财去；财帛宫见禄存，主稳定积累；财帛宫遇空劫，主财耗虚名。',
          translation: 'Cung Tài Bạch Hóa Lộc nhập Mệnh chủ tiền vào rộng rãi; cung Tài Bạch Hóa Kỵ chủ tiền đến rồi đi; cung Tài Bạch gặp Lộc Tồn chủ tích lũy ổn định; cung Tài Bạch gặp Không Kiếp chủ hao tài, danh hão.',
        },
      ],
    },
    {
      title: 'Luận mười hai cung · Cung Quan Lộc',
      titleZh: '十二宫论·官禄宫',
      subtitle: 'Gốc của sự nghiệp',
      paragraphs: [
        {
          id: 'qs-3-1',
          idx: 1,
          text: '官禄宫主事业、地位、社会成就。官禄宫主星不同，事业方向各异：紫微在官宜大平台高位，太阳在官宜公务名声，武曲在官宜金融实业，廉贞在官宜文武兼备。',
          translation: 'Cung Quan Lộc chủ sự nghiệp, địa vị và thành tựu xã hội. Chính tinh cung Quan Lộc khác nhau thì hướng sự nghiệp cũng khác: Tử Vi ở Quan hợp nền tảng lớn, vị trí cao; Thái Dương ở Quan hợp công vụ, danh tiếng; Vũ Khúc ở Quan hợp tài chính, thực nghiệp; Liêm Trinh ở Quan hợp việc kiêm cả văn lẫn võ.',
        },
        {
          id: 'qs-3-2',
          idx: 2,
          text: '官禄宫化权入命，主能独当一面；化禄入官，主财从职业来；化忌入官，主职场波折。',
          translation: 'Cung Quan Lộc Hóa Quyền nhập Mệnh chủ có thể tự gánh vác một phương; Hóa Lộc nhập Quan chủ tiền đến từ nghề nghiệp; Hóa Kỵ nhập Quan chủ chốn công sở nhiều sóng gió.',
        },
      ],
    },
    {
      title: 'Luận mười hai cung · Cung Phu Thê',
      titleZh: '十二宫论·夫妻宫',
      subtitle: 'Khí chất người phối ngẫu',
      paragraphs: [
        {
          id: 'qs-4-1',
          idx: 1,
          text: '夫妻宫主配偶气质、婚姻状态。夫妻宫紫微主配偶端庄威权，宜迟婚；夫妻宫贪狼主配偶多情，桃花重；夫妻宫天梁主配偶成熟稳重，年长。',
          translation: 'Cung Phu Thê chủ khí chất người phối ngẫu và tình trạng hôn nhân. Phu Thê có Tử Vi chủ người phối ngẫu đoan trang, có uy quyền, nên kết hôn muộn; Phu Thê có Tham Lang chủ người phối ngẫu đa tình, đào hoa nặng; Phu Thê có Thiên Lương chủ người phối ngẫu chín chắn, điềm đạm, lớn tuổi hơn.',
        },
        {
          id: 'qs-4-2',
          idx: 2,
          text: '夫妻宫化忌冲命，主婚姻多波折。夫妻宫见六煞，需特别注意感情之磨砺。夫妻宫见六吉，主配偶贵人。',
          translation: 'Cung Phu Thê Hóa Kỵ xung Mệnh chủ hôn nhân nhiều trắc trở. Cung Phu Thê gặp Lục Sát cần đặc biệt lưu ý những thử thách trong tình cảm. Cung Phu Thê gặp Lục Cát chủ người phối ngẫu là quý nhân.',
        },
      ],
    },
    {
      title: 'Luận Tứ Hóa',
      titleZh: '四化论',
      subtitle: 'Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ',
      paragraphs: [
        {
          id: 'qs-5-1',
          idx: 1,
          text: '四化为命盘之精华——化禄主财、化权主势、化科主名、化忌主病。四化所在宫位，决定一生重大事件之节点。',
          translation: 'Tứ Hóa là tinh hoa của lá số — Hóa Lộc chủ tài, Hóa Quyền chủ thế, Hóa Khoa chủ danh, Hóa Kỵ chủ bệnh. Cung có Tứ Hóa quyết định các mốc sự kiện trọng đại của cả đời.',
        },
        {
          id: 'qs-5-2',
          idx: 2,
          text: '生年四化为本命四化，永远固定；倪师强调四化星不动，只看大限流年走到何处。北派飞星派之自化、宫干飞化、来因宫等，倪师不主张使用。',
          translation: 'Tứ Hóa năm sinh là Tứ Hóa bản mệnh, cố định mãi mãi; thầy Nghê nhấn mạnh sao Tứ Hóa không di chuyển, chỉ xem Đại Hạn, Lưu Niên đi đến đâu. Các kỹ thuật của Bắc phái Phi Tinh như Tự Hóa, phi hóa theo can cung, cung Lai Nhân…, thầy Nghê không chủ trương sử dụng.',
        },
        {
          id: 'qs-5-3',
          idx: 3,
          text: '化禄入命三方四正：财源稳定，缘分广，能力可变现。化禄入夫妻：婚姻甜蜜。化禄入官禄：事业财源相应。',
          translation: 'Hóa Lộc nhập Tam Phương Tứ Chính của Mệnh: nguồn tiền ổn định, duyên rộng, năng lực có thể đổi thành tiền. Hóa Lộc nhập Phu Thê: hôn nhân ngọt ngào. Hóa Lộc nhập Quan Lộc: sự nghiệp và tài lộc tương ứng nhau.',
        },
        {
          id: 'qs-5-4',
          idx: 4,
          text: '化忌入命三方四正：一生有深刻功课，宜面对而非逃避。化忌入夫妻：婚姻多磨砺。化忌入官禄：事业多波折，但磨练后反成专业人才。',
          translation: 'Hóa Kỵ nhập Tam Phương Tứ Chính của Mệnh: cả đời có bài học sâu sắc, nên đối diện chứ đừng né tránh. Hóa Kỵ nhập Phu Thê: hôn nhân nhiều thử thách. Hóa Kỵ nhập Quan Lộc: sự nghiệp nhiều sóng gió, nhưng sau khi tôi luyện lại thành người giỏi chuyên môn.',
        },
      ],
    },
    {
      title: 'Cách Cơ Nguyệt Đồng Lương',
      titleZh: '机月同梁格',
      subtitle: 'Mệnh tích lũy ổn định',
      paragraphs: [
        {
          id: 'qs-6-1',
          idx: 1,
          text: '天机太阴天同天梁四星齐入命三方四正，称机月同梁格。文质彬彬、聪慧善谋，最适合公职、学术、文艺、医疗、服务等需稳定累积的行业。',
          translation: 'Bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng nhập Tam Phương Tứ Chính của Mệnh, gọi là cách Cơ Nguyệt Đồng Lương. Người nho nhã lịch thiệp, thông minh giỏi mưu tính, hợp nhất với các ngành cần tích lũy ổn định như công chức, học thuật, văn nghệ, y tế, dịch vụ.',
        },
        {
          id: 'qs-6-2',
          idx: 2,
          text: '机月同梁作吏人——古云此格者宜担任公职、行政文书工作，安稳一生。再会昌曲化科，主名声远播。最忌煞星过多，则反主多变难安。',
          translation: '"Cơ Nguyệt Đồng Lương tác lại nhân" — người xưa nói người có cách này nên làm công chức, công việc hành chính văn thư, cả đời yên ổn. Nếu hội thêm Xương Khúc, Hóa Khoa thì chủ danh tiếng vang xa. Kỵ nhất là quá nhiều sát tinh, khi đó trái lại chủ hay biến động, khó yên.',
        },
      ],
    },
    {
      title: 'Cách Song Lộc Triều Viên',
      titleZh: '双禄朝垣格',
      subtitle: 'Giàu sánh Đào Chu',
      paragraphs: [
        {
          id: 'qs-7-1',
          idx: 1,
          text: '化禄与禄存同会命宫三方四正，称双禄朝垣格。古云"双禄朝垣，富比陶朱"，主一生不愁财，多有正财横财兼得。',
          translation: 'Hóa Lộc và Lộc Tồn cùng hội ở Tam Phương Tứ Chính của cung Mệnh, gọi là cách Song Lộc Triều Viên. Người xưa nói "Song Lộc triều viên, giàu sánh Đào Chu", chủ cả đời không lo tiền bạc, thường được cả chính tài lẫn hoạnh tài.',
        },
        {
          id: 'qs-7-2',
          idx: 2,
          text: '双禄朝垣最忌空劫——空劫一冲，则双禄成虚名。需见左辅右弼或文昌文曲，方为正格。',
          translation: 'Song Lộc Triều Viên kỵ nhất Không Kiếp — Không Kiếp xung vào thì song Lộc thành hư danh. Cần gặp Tả Phù, Hữu Bật hoặc Văn Xương, Văn Khúc mới là chính cách.',
        },
      ],
    },
  ],
};
