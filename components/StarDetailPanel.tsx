'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star } from '@/lib/ziwei/types';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';
import { viTerm, viTerms } from '@/lib/i18n/vi';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

// 倪海厦体系各星详细解读（参考顾祥弘《飞星紫微斗数全书》及南北山人《紫微斗数全书》）
// Keys stay in Chinese (engine identifiers); values are Vietnamese. Classical quotations keep the
// Chinese original in 「」 followed by a Vietnamese translation in parentheses.
const STAR_DETAIL: Record<string, {
  niHaixia: string;
  classical: string;
  bestPalace: string;
  worstPalace: string;
  career: string;
  relationship: string;
  wealth: string;
  health: string;
}> = {
  '紫微': {
    niHaixia: 'Thầy Nghê cho rằng Tử Vi là sao hoàng đế; người có Tử Vi thủ Mệnh mang khí chất cô ngạo, thích ở một mình, không thích bị người khác quản thúc. Tử Vi cần Tả Phù, Hữu Bật giáp hai bên mới phát huy được khí chất đế vương, nếu không chỉ là "cô quân", giàu mà không sang. Tử Vi ở Thìn, Tuất là tốt nhất, cùng Thiên Phủ tạo thành cách song tinh, tài quan song mỹ, có thể xuất tướng nhập tướng. Tử Vi sợ nhất Hỏa Tinh, Linh Tinh, Kình Dương, Đà La đồng cung; gặp sát tinh thì cô quý, có quyền mà không có tiền.',
    classical: 'Cổ quyết: 「紫微帝座临命主尊贵，统领众星，坐命者主权威显达。」 (Tử Vi là đế tọa, lâm Mệnh chủ tôn quý, thống lĩnh chúng tinh; người Tử Vi thủ Mệnh chủ quyền uy hiển đạt.) Nam Bắc Sơn Nhân chú: 「紫微守命于辰位，财官双美，出将入相，位至三公；子宫安命者，富贵不耐久，日后不美。」 (Tử Vi thủ Mệnh tại Thìn, tài quan song mỹ, xuất tướng nhập tướng, quan đến Tam Công; an Mệnh tại cung Tý thì phú quý không bền, về sau không đẹp.)',
    bestPalace: 'Mệnh (Thìn, Tuất), Quan Lộc',
    worstPalace: 'Tật Ách, Phu Thê',
    career: 'Chính trường, quản lý cấp cao, tự khởi nghiệp; khí chất đế vương bẩm sinh, hợp vị trí lãnh đạo tự mình gánh vác một phương',
    relationship: 'Thụ động trong tình cảm, lòng tự trọng cao, cần đối phương chủ động; có xu hướng cô độc, kết hôn muộn thì tốt',
    wealth: 'Tài vận ổn định, giữ của giỏi hơn tiến thủ; ở Thìn, Tuất tài quan song mỹ, hợp nhất với đầu tư tích lũy dài hạn',
    health: 'Hành Thổ, chú ý tỳ vị, hệ tiêu hóa. Kiêng làm việc quá sức, nên sinh hoạt điều độ',
  },
  '天机': {
    niHaixia: 'Thầy Nghê nói Thiên Cơ là sao mưu sĩ, thông minh nhất trong các sao, nhưng thông minh lộ ra ngoài thì hại thân. Thiên Cơ Hóa Kỵ là phiền phức nhất, ứng với câu "thông minh lại bị thông minh hại". Thiên Cơ hành Mộc, linh hoạt hay biến; thủ Mệnh thì tư duy nhanh nhạy nhưng thường nhiều mưu ít quyết, phải rời quê đi xa mới phát triển được. Tùy cơ ứng biến chính là đặc trưng lớn nhất của sao này.',
    classical: 'Cổ quyết: 「为人生精滑，自好作经营，天机星属木，商买皆多机见，离宗必远亲，机谋必远离亲。」 (Người tinh nhanh khéo léo, ưa kinh doanh; Thiên Cơ thuộc Mộc, buôn bán nhiều cơ biến; xa tông tộc, ắt xa người thân.) Nam Bắc Sơn Nhân chú: 「天机居庙旺地，主人生精明，善策划；居陷地则暗淡，人人皆从商为业。」 (Thiên Cơ ở đất Miếu Vượng chủ người tinh minh, giỏi hoạch định; ở đất Hãm thì ảm đạm, phần nhiều theo nghề buôn bán.)',
    bestPalace: 'Mệnh (Mão), Quan Lộc',
    worstPalace: 'Phu Thê',
    career: 'Chuyên gia kỹ thuật, mưu sĩ, nhà nghiên cứu, CNTT, hoạch định chiến lược; dùng đầu óc hơn tay chân, hợp phát triển xa quê',
    relationship: 'Tình cảm hay thay đổi, suy nghĩ quá nhiều, khó chuyên nhất; nên kết hôn muộn, sau khi cưới cần học cách buông bớt lo nghĩ',
    wealth: 'Kiếm tiền bằng trí tuệ và kỹ năng, không giỏi giữ của; lấy chuyên môn kỹ thuật làm nghề thì tài vận ổn định',
    health: 'Hành Mộc, chú ý gan mật, hệ thần kinh. Suy nghĩ nặng nề dễ mất ngủ, nên tập tĩnh tâm, thiền định',
  },
  '太阳': {
    niHaixia: 'Thầy Nghê cho rằng Thái Dương là sao của chủ nghĩa đại trượng phu; từ Mão đến Ngọ là nhập Miếu, quang minh chính đại; sau Ngọ dần lạc hãm. Người Thái Dương thủ Mệnh hào phóng, trọng thể diện; hợp với mệnh nam, còn mệnh nữ thì quá mạnh mẽ. Thái Dương đại diện cho cha và bậc trưởng bối; ở Mệnh chủ tính cách hướng ngoại, cởi mở, thích được mọi người chú ý, hợp nhất với công chức hoặc sự nghiệp công chúng. Lạc hãm thì trước siêng sau lười, cô quả, lao lực.',
    classical: 'Cổ quyết: 「太阳居午为入庙，光辉大放，主贵显，男命最佳；落陷则孤寡劳碌，先勤后懒。」 (Thái Dương ở Ngọ là nhập Miếu, ánh sáng rực rỡ, chủ quý hiển, mệnh nam tốt nhất; lạc hãm thì cô quả lao lực, trước siêng sau lười.) Nam Bắc Sơn Nhân chú: 「太阳在午宫守命，财官双美，出将入相；辰位安命，中年财官变美，乙年生人遇凶亦大利。」 (Thái Dương thủ Mệnh tại Ngọ, tài quan song mỹ, xuất tướng nhập tướng; an Mệnh tại Thìn thì trung niên tài quan trở nên tốt đẹp, người sinh năm Ất dù gặp hung cũng đại lợi.)',
    bestPalace: 'Mệnh (Mão đến Ngọ), Quan Lộc',
    worstPalace: 'Phu Thê (mệnh nữ), Tật Ách',
    career: 'Công chức, chính trường, quản lý, quan hệ công chúng, giáo dục, truyền thông; thích đứng trước đám đông, hợp sự nghiệp công chúng',
    relationship: 'Mệnh nam có duyên nhưng đa tình; mệnh nữ độc lập, mạnh mẽ, hôn nhân cần thời gian dung hòa, nên tìm bạn đời dịu dàng, chu đáo',
    wealth: 'Tài vận nhờ nỗ lực, hào phóng hay giúp người, không giỏi tích lũy; nhập Miếu thì tài vận vượng, lạc hãm thì tài vận thăng trầm',
    health: 'Hành Hỏa, chú ý tim, mắt. Khi lạc hãm dễ lao lực quá độ, cần nghỉ ngơi đầy đủ',
  },
  '武曲': {
    niHaixia: 'Thầy Nghê xem Vũ Khúc là chủ tinh tài bạch, cứng rắn không chịu khuất phục, sợ nhất cô khắc. Người Vũ Khúc thủ Mệnh ý chí kiên định, hợp tài chính, quản lý tiền bạc, nhưng trong tình cảm quá thẳng, dễ làm tổn thương người khác. Vũ Khúc Hóa Kỵ phải cẩn thận tai nạn, huyết quang. Vũ Khúc ở Thìn, Tuất, Sửu, Mùi đắc vượng địa, đồng cung với Thất Sát thành cách "tướng tài", là cách cục giàu có rất tốt.',
    classical: 'Cổ quyết: 「武曲属金，刚强之性，一生多刑克；守命于旺地，出将入相。」 (Vũ Khúc thuộc Kim, tính cương cường, một đời nhiều hình khắc; thủ Mệnh ở vượng địa thì xuất tướng nhập tướng.) Nam Bắc Sơn Nhân chú: 「武曲守命，三方四正俱吉，财官双美，武职加辅弼昌曲，亦主大贵；与七杀同宫，为将财格，主大富。」 (Vũ Khúc thủ Mệnh, Tam Phương Tứ Chính đều cát thì tài quan song mỹ; võ chức thêm Phụ, Bật, Xương, Khúc cũng chủ đại quý; đồng cung với Thất Sát là cách "tướng tài", chủ đại phú.)',
    bestPalace: 'Mệnh (Thìn, Tuất, Sửu, Mùi), Tài Bạch, Quan Lộc',
    worstPalace: 'Phu Thê',
    career: 'Tài chính, quân đội, cảnh sát, kế toán, kỹ thuật công trình; năng lực thực thi rất mạnh, hợp lĩnh vực cần bản lĩnh và quyết đoán',
    relationship: 'Tình cảm thẳng thắn, thiếu lãng mạn, cần bạn đời dịu dàng để bổ khuyết; kỵ cô khắc trong tình cảm',
    wealth: 'Bản chất là tài tinh, tài vận rất mạnh, năng lực quản lý tiền vượt trội; ở Thìn, Tuất tài quan song mỹ',
    health: 'Hành Kim, chú ý phổi, hệ hô hấp, răng. Khi Hóa Kỵ cần đề phòng tai nạn, huyết quang',
  },
  '天同': {
    niHaixia: 'Thầy Nghê nói Thiên Đồng là phúc tinh, cũng là sao lười nhất. Thiên Đồng thủ Mệnh thích hưởng phúc, không thích cạnh tranh, hợp công việc ổn định. Thiên Đồng đồng cung với Thiên Lương là tốt nhất, vừa hưởng phúc vừa có bảo đảm. Thiên Đồng Hóa Lộc là Hóa Lộc đẹp nhất, chủ một đời cơm áo không lo, vui vẻ thong dong. Thiên Đồng kỵ lạc hãm, lạc hãm thì phúc giảm, cần hóa giải các hung tinh.',
    classical: 'Cổ quyết: 「天同为福德之星，坐命者享福有余，主一生逍遥自在，不必劳苦。」 (Thiên Đồng là sao phúc đức, thủ Mệnh thì hưởng phúc có thừa, chủ một đời tiêu dao tự tại, không phải lao khổ.) Nam Bắc Sơn Nhân chú: 「天同守命，三方无煞，一生快乐，衣食丰足；加吉星则富贵双全，为人温和，多人缘。」 (Thiên Đồng thủ Mệnh, tam phương không có sát tinh thì một đời vui vẻ, cơm áo đủ đầy; thêm cát tinh thì phú quý song toàn, tính người ôn hòa, được lòng người.)',
    bestPalace: 'Mệnh, Phúc Đức',
    worstPalace: 'Quan Lộc',
    career: 'Ngành dịch vụ, giải trí, ẩm thực, văn nghệ; môi trường nhẹ nhàng vui vẻ là hợp nhất, kỵ áp lực cạnh tranh cao',
    relationship: 'Tình cảm ôn hòa, không chủ động, dễ thụ động đón nhận; hôn nhân khá ổn định, tính tình dễ gần, dễ mến',
    wealth: 'Tài vận không nổi bật, dựa vào lương ổn định, không giỏi đầu cơ; cơm áo không lo nhưng khó đại phú',
    health: 'Hành Thủy, chú ý thận, bàng quang. Thể chất khá yếu, nên vận động vừa phải, giữ tâm thái thoải mái',
  },
  '廉贞': {
    niHaixia: 'Thầy Nghê cho rằng Liêm Trinh là "thứ đào hoa", tài hoa tràn đầy nhưng tình cảm phức tạp. Liêm Trinh Hóa Kỵ rất hung, chủ kiện tụng, lao ngục, tai nạn. Liêm Trinh đồng cung với Thiên Tướng thì hóa hung thành cát, thành cách "hành chính ấn thụ". Liêm Trinh ngũ hành thuộc Hỏa, tính cương liệt, một đời nhiều thăng trầm, tài nghệ xuất chúng; nếu giữ được chính đạo không sa vào tà lệch thì có thể thành đại khí.',
    classical: 'Cổ quyết: 「廉贞为次桃花，才华横溢，感情多波折；廉相同宫，化凶为吉，成行政印绶格，可掌权柄。」 (Liêm Trinh là thứ đào hoa, tài hoa tràn đầy, tình cảm nhiều trắc trở; Liêm Tướng đồng cung thì hóa hung thành cát, thành cách hành chính ấn thụ, có thể nắm quyền bính.) Nam Bắc Sơn Nhân chú: 「廉贞守命，见吉星则才华出众，化忌则官司缠身，主血光之灾，须防。」 (Liêm Trinh thủ Mệnh, gặp cát tinh thì tài hoa xuất chúng; Hóa Kỵ thì kiện tụng đeo bám, chủ tai họa huyết quang, phải đề phòng.)',
    bestPalace: 'Quan Lộc (cùng Thiên Tướng), Mệnh (khi Hóa Lộc)',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Phu Thê',
    career: 'Nghệ thuật, giải trí, pháp luật, công chức (cùng Thiên Tướng); tài nghệ xuất chúng, giữ nghề chính đáng mới bền lâu',
    relationship: 'Đào hoa nhiều, tình cảm phức tạp, dễ gặp rắc rối tình cảm; nên kết hôn muộn, chọn bạn đời chín chắn',
    wealth: 'Tài vận thăng trầm, kiếm tiền nhờ tài nghệ; khi Hóa Kỵ đề phòng tranh chấp tài chính và rủi ro pháp lý',
    health: 'Hành Hỏa, chú ý tim, máu, gan. Khi Hóa Kỵ đề phòng tai nạn và phẫu thuật, lưu ý huyết quang',
  },
  '天府': {
    niHaixia: 'Thầy Nghê nói Thiên Phủ là sao kho tài, sao thủ thành, không chủ động phát tài nhưng giữ được của cải. Người Thiên Phủ thủ Mệnh chín chắn, bảo thủ; mệnh nữ tốt nhất, có thể vượng phu hưng gia. Thiên Phủ thích nhất Tử Vi đồng cung hoặc xung chiếu, tạo thành cách song tinh, tài quan song mỹ. Thiên Phủ sợ Không Kiếp giáp; gặp Không Kiếp thì kho tài cạn đáy, không giữ được tiền.',
    classical: 'Cổ quyết: 「天府为财库之星，守命者稳重保守，主积财旺家；女命逢之，能旺夫益子，家道兴隆。」 (Thiên Phủ là sao kho tài, thủ Mệnh thì chín chắn bảo thủ, chủ tích của vượng nhà; mệnh nữ gặp được thì vượng phu ích tử, gia đạo hưng long.) Nam Bắc Sơn Nhân chú: 「天府守命，三方吉聚，财官双美，富贵安康；遇空劫，则财库破漏，难以积财。」 (Thiên Phủ thủ Mệnh, tam phương hội cát thì tài quan song mỹ, phú quý an khang; gặp Không Kiếp thì kho tài thủng vỡ, khó tích lũy của cải.)',
    bestPalace: 'Mệnh, Tài Bạch, Điền Trạch',
    worstPalace: 'Thiên Di',
    career: 'Quản lý hành chính, tài vụ, bảo hiểm, bất động sản; cầu ổn định không mạo hiểm, hợp nghề nghiệp kiểu thủ thành',
    relationship: 'Tình cảm ổn định, chăm lo gia đình, là người bạn đời tốt; coi trọng cảm giác an toàn và bảo đảm kinh tế của gia đình',
    wealth: 'Tài vận rất tốt, khả năng giữ của mạnh; hợp nhất với đầu tư tích lũy và mua sắm bất động sản',
    health: 'Hành Thổ, chú ý tỳ vị, tiêu hóa. Thể chất vững vàng, nên ăn uống và sinh hoạt điều độ',
  },
  '太阴': {
    niHaixia: 'Thầy Nghê cho rằng Thái Âm là tài tinh, lợi cho mệnh nữ, đồng thời là sao đại diện cho mẹ và vợ trong mệnh nam. Thái Âm nhập Miếu thì tài vận rất tốt, ở đất hãm thì tài vận bị cản trở. Thái Âm Hóa Kỵ cần lưu ý chuyện của người thân nữ giới. Thái Âm ở Hợi, Tý nhập Miếu, ánh sáng chiếu khắp, đại diện cho sự thanh nhã tinh tế, tình cảm phong phú, coi trọng thế giới nội tâm và đời sống tinh thần.',
    classical: 'Cổ quyết: 「太阴为财星，利女命；亥子入庙，光辉全照，财运极旺；午位落陷，忧郁多情，财运平淡。」 (Thái Âm là tài tinh, lợi mệnh nữ; ở Hợi, Tý nhập Miếu, ánh sáng chiếu khắp, tài vận cực vượng; ở Ngọ lạc hãm thì u uất đa tình, tài vận bình thường.) Nam Bắc Sơn Nhân chú: 「太阴守命，入庙者财富优厚，女命尤佳；落陷者需努力方能致富，情感细腻。」 (Thái Âm thủ Mệnh, nhập Miếu thì tài sản dồi dào, mệnh nữ càng tốt; lạc hãm thì phải nỗ lực mới giàu được, tình cảm tinh tế.)',
    bestPalace: 'Mệnh (Hợi, Tý), Tài Bạch',
    worstPalace: 'Mệnh (Ngọ, đất hãm)',
    career: 'Tài vụ, tài chính, bất động sản, nghệ thuật, giáo dục; tỉ mỉ, kiên nhẫn, hợp nghề cần thẩm mỹ và sự dịu dàng',
    relationship: 'Tình cảm dịu dàng tinh tế, coi trọng cảm xúc bên trong, cần một mối quan hệ ổn định đem lại cảm giác an toàn',
    wealth: 'Nhập Miếu thì tài vận cực vượng, lạc hãm thì phải nỗ lực; quản lý tiền cẩn thận, giỏi tích lũy, không giỏi mạo hiểm',
    health: 'Hành Thủy, chú ý thận, tử cung (mệnh nữ). Cảm xúc dao động ảnh hưởng sức khỏe, nên giữ tâm trạng thư thái',
  },
  '贪狼': {
    niHaixia: 'Thầy Nghê nói Tham Lang là sao đa tài đa nghệ nhất, đào hoa nặng nhất. Tham Lang Hóa Lộc nhập Mệnh thì sức hút tỏa khắp, ai gặp cũng mến. Tham Lang là sao phát muộn, sau trung niên mới thật sự phát đạt. Tham Lang ở Dần, Thân nhập Miếu là tốt nhất, đào hoa vượng thịnh, tài nghệ hơn người; sau khi Hóa Lộc thì tài vận đại phát, nhưng nếu gặp Không Kiếp thì một đời nhiều trắc trở, khó tụ tài.',
    classical: 'Cổ quyết: 「贪狼发福亨通，多才多艺，桃花最重；然难过三十岁，晚发者众。落陷遇煞反吉，此系贪狼落陷之理。」 (Tham Lang phát phúc hanh thông, đa tài đa nghệ, đào hoa nặng nhất; nhưng khó qua tuổi ba mươi, phần nhiều phát muộn. Lạc hãm gặp sát lại thành cát, đó là lý của Tham Lang lạc hãm.) Nam Bắc Sơn Nhân chú: 「贪狼守命，遇吉则福禄多寿，发福亨通；但久后不得善终，故宜修身养德，方可善终。」 (Tham Lang thủ Mệnh, gặp cát thì phúc lộc thọ dài, phát phúc hanh thông; nhưng lâu dài khó có kết cục tốt, nên cần tu thân dưỡng đức mới được trọn vẹn về sau.)',
    bestPalace: 'Mệnh (Hóa Lộc), Phúc Đức, Thiên Di',
    worstPalace: 'Tật Ách',
    career: 'Nghệ thuật, giải trí, quan hệ công chúng, kinh doanh bán hàng, phong thủy ngũ thuật; dựa vào quan hệ và tài nghệ, thuộc kiểu đa tài đa nghệ',
    relationship: 'Đào hoa cực vượng, tình cảm đa dạng; nên kết hôn muộn, sau khi cưới cần kiềm chế đào hoa mới bạc đầu giai lão',
    wealth: 'Kiếm tiền nhờ quan hệ và tài nghệ, tài vận đến trung vãn niên mới ổn; sau khi Hóa Lộc thì tiền vào nhiều đường, thời trẻ nên giữ vững',
    health: 'Hành Mộc (kiêm Thủy), chú ý gan, thận. Đào hoa quá vượng dễ hao tổn tinh lực, nên tiết chế điều dưỡng',
  },
  '巨门': {
    niHaixia: 'Thầy Nghê cho rằng Cự Môn là sao khẩu thiệt thị phi, nhưng khi Hóa Lộc, Hóa Quyền thì chuyển cát, thành cách kiếm tiền bằng tài ăn nói. Cự Môn thủ Mệnh đa nghi, giỏi biện luận, hợp làm luật sư, giáo viên, bán hàng. Cự Môn kỵ nhất Hóa Kỵ, chủ khẩu thiệt thị phi không dứt, thậm chí dẫn đến kiện tụng. Cự Môn ở Tý, Ngọ khá tốt, ăn nói giỏi, chủ lập thân bằng lời nói.',
    classical: 'Cổ quyết: 「巨门为暗曜，主口舌是非；化禄权则转为以口才谋生，主富贵。」 (Cự Môn là ám tinh, chủ khẩu thiệt thị phi; Hóa Lộc, Hóa Quyền thì chuyển thành mưu sinh bằng tài ăn nói, chủ phú quý.) Nam Bắc Sơn Nhân chú: 「巨门守命，逢化禄权，以口舌为业者大吉；化忌则口舌连累，官司缠身，需谨慎言语。」 (Cự Môn thủ Mệnh gặp Hóa Lộc, Hóa Quyền thì người lấy miệng lưỡi làm nghề đại cát; Hóa Kỵ thì bị lời nói liên lụy, kiện tụng đeo bám, cần cẩn trọng lời ăn tiếng nói.)',
    bestPalace: 'Quan Lộc (Hóa Lộc, Hóa Quyền), Mệnh (Tý, Ngọ)',
    worstPalace: 'Phu Thê, Tật Ách (Hóa Kỵ)',
    career: 'Luật sư, giáo viên, bán hàng, người dẫn chương trình, chuyên gia đàm phán; tài ăn nói là năng lực cạnh tranh cốt lõi',
    relationship: 'Đa nghi đa lự, dễ nghĩ quá nhiều; giao tiếp là chìa khóa của hôn nhân, cần chọn bạn đời kiên nhẫn',
    wealth: 'Kiếm tiền nhờ tài ăn nói và kỹ năng chuyên môn; Hóa Lộc thì tài vận khá tốt, Hóa Kỵ đề phòng tranh chấp tài chính do lời nói liên lụy',
    health: 'Hành Thủy, chú ý thận, tai, khoang miệng. Lo nghĩ nhiều dễ hại thân, nên học cách thư giãn, giảm áp lực',
  },
  '天相': {
    niHaixia: 'Thầy Nghê nói Thiên Tướng là sao ấn thụ, phụ trách việc hành chính, sự vụ. Người Thiên Tướng thủ Mệnh khuôn phép đúng mực, hợp công chức hành chính. Thiên Tướng cần nhất có sao mạnh phối hợp mới phát huy được, một mình thủ Mệnh thì khá bình thường. Thiên Tướng thích nhất Liêm Trinh đi cùng, tạo thành cách Liêm Tướng, có thể nắm quyền hành chính lớn; sợ nhất Phá Quân đồng cung, tạo thành cách "Hình Kỵ giáp Ấn", chủ hung hiểm.',
    classical: 'Cổ quyết: 「天相为印绶之星，主行政庶务；廉相同宫，化凶为吉，掌行政大权。」 (Thiên Tướng là sao ấn thụ, chủ việc hành chính sự vụ; Liêm Tướng đồng cung thì hóa hung thành cát, nắm đại quyền hành chính.) Nam Bắc Sơn Nhân chú: 「天相守命，中规中矩，适合公职；得廉贞相配，可成国家栋梁；破军同守，则刑克难免。」 (Thiên Tướng thủ Mệnh thì khuôn phép đúng mực, hợp công chức; được Liêm Trinh phối hợp có thể thành rường cột quốc gia; Phá Quân cùng thủ thì khó tránh hình khắc.)',
    bestPalace: 'Quan Lộc, Mệnh (cùng Liêm Trinh)',
    worstPalace: 'Tài Bạch, Mệnh (cùng Phá Quân thành Hình Kỵ giáp Ấn)',
    career: 'Công chức, quản lý hành chính, thư ký, trợ lý; giỏi vai trò hỗ trợ, cần sao mạnh dẫn đường',
    relationship: 'Tình cảm ổn định, trung hậu thật thà, là người bạn đời tốt, nhưng cần đối phương định hướng',
    wealth: 'Tài vận bình ổn, tích lũy nhờ lương, không hợp đầu tư mạo hiểm; quản lý tài chính kiểu thủ thành là hợp nhất',
    health: 'Hành Thủy, chú ý thận, hệ bạch huyết. Thể chất trung bình, nên giữ thói quen sinh hoạt điều độ',
  },
  '天梁': {
    niHaixia: 'Thầy Nghê cho rằng Thiên Lương là ấm tinh, có thể che chở người khác, cũng đại diện cho y dược, tôn giáo. Người Thiên Lương thủ Mệnh có duyên với bậc trưởng bối, thời trẻ nhiều gian nan, về già hưởng phúc. Thiên Lương sợ nhất Hóa Kỵ, chủ trưởng bối hoặc sức khỏe có vấn đề. Thiên Lương đồng cung với Thái Dương là tốt nhất, nhật nguyệt cùng sáng, quý nhân che chở, một đời có quý nhân tương trợ, cuối cùng được bình an.',
    classical: 'Cổ quyết: 「天梁为荫星，主庇荫保护；坐命者有长辈缘，早年受磨练，晚年享清福。」 (Thiên Lương là ấm tinh, chủ che chở bảo hộ; thủ Mệnh thì có duyên với trưởng bối, thời trẻ chịu rèn giũa, về già hưởng thanh phúc.) Nam Bắc Sơn Nhân chú: 「天梁守命，须逢吉星方能发达；遇太阳同宫，日月并明，主贵显，一生多贵人相助。」 (Thiên Lương thủ Mệnh phải gặp cát tinh mới phát đạt; gặp Thái Dương đồng cung, nhật nguyệt cùng sáng, chủ quý hiển, một đời nhiều quý nhân giúp đỡ.)',
    bestPalace: 'Mệnh, Phụ Mẫu, Phúc Đức',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Tài Bạch',
    career: 'Y tế, tôn giáo, pháp luật, công tác xã hội, từ thiện; thích giúp người, có lòng che chở mọi người',
    relationship: 'Tình cảm thường với người chênh lệch tuổi khá nhiều, hoặc duyên đến muộn; cần kiên nhẫn chờ đợi mới gặp lương duyên',
    wealth: 'Tài vận nhờ quý nhân giúp đỡ; thời trẻ tài vận kém, về già mới vững; nên giữ, không nên xông pha',
    health: 'Hành Thổ, chú ý tỳ vị, xương khớp. Cần coi trọng chăm sóc sức khỏe tuổi già, nên sớm phòng ngừa, điều dưỡng',
  },
  '七杀': {
    niHaixia: 'Thầy Nghê nói Thất Sát là sao tướng quân, quả quyết, xung kích mạnh, nhưng có tính cô khắc. Thất Sát thủ Mệnh cần có phụ tinh hóa giải tính cô độc, nếu không thì duyên lục thân mỏng. Thất Sát đồng cung với Vũ Khúc là cách "tướng tài", rất tốt. Thất Sát sợ nhất "Trúc La tam hạn" (Dương, Đà, Hỏa, Linh cùng chiếu), chủ đại hung, phải đề phòng tai nạn. Thất Sát sau khi Hóa Lộc lại thành cát, có thể thành bậc đại tướng chi tài.',
    classical: 'Cổ quyết: 「七杀为将军之星，果决冲劲强；守命者孤克性重，六亲缘薄。」 (Thất Sát là sao tướng quân, quả quyết, xung kích mạnh; thủ Mệnh thì tính cô khắc nặng, duyên lục thân mỏng.) Nam Bắc Sơn Nhân chú: 「七杀守命，三合吉聚则大贵；遇竹罗三限（羊陀火铃），主大凶，防意外之灾，防刑克。」 (Thất Sát thủ Mệnh, tam hợp hội cát thì đại quý; gặp Trúc La tam hạn (Dương, Đà, Hỏa, Linh) chủ đại hung, phải phòng tai nạn bất ngờ, phòng hình khắc.)',
    bestPalace: 'Mệnh (có phụ tinh), Quan Lộc',
    worstPalace: 'Phu Thê, Phụ Mẫu',
    career: 'Quân đội, cảnh sát, khởi nghiệp, giao dịch tài chính, lĩnh vực tự mình gánh vác; cần quyết đoán nhanh và bản lĩnh',
    relationship: 'Tình cảm cô khắc, khó tìm được bạn đời phù hợp; cần người bao dung được cá tính mạnh, nên kết hôn muộn',
    wealth: 'Tài vận biến động lớn, có cơ hội đại phú nhưng cũng thăng trầm dữ dội; đồng cung Vũ Khúc thành cách "tướng tài", đại quý',
    health: 'Hành Kim, chú ý phổi, đại tràng. Tính nóng nảy dễ hại thân, nên học cách kiểm soát cảm xúc và tu dưỡng bản thân',
  },
  '破军': {
    niHaixia: 'Thầy Nghê nói Phá Quân là sao giỏi phá cũ lập mới nhất, cũng là một trong những sao cô khắc nhất. Phá Quân phải Hóa Lộc mới trở nên tốt, chủ phá rồi mới lập. Phá Quân thủ Mệnh duyên lục thân mỏng, nhưng năng lực khai sáng cực mạnh. Phá Quân hợp nhất với cải cách, đổi mới; khi Hóa Lộc thì tài vận chuyển vượng, một phá một lập, cuối cùng có thể thành tựu sự nghiệp.',
    classical: 'Cổ quyết: 「破军为最能破旧立新之星，坐命者孤克，六亲缘薄，然开创能力超强；化禄后破而后立，可成大业。」 (Phá Quân là sao giỏi phá cũ lập mới nhất, thủ Mệnh thì cô khắc, duyên lục thân mỏng, nhưng năng lực khai sáng vượt trội; Hóa Lộc thì phá rồi lại lập, có thể thành đại nghiệp.) Nam Bắc Sơn Nhân chú: 「破军守命，一生多波折；化禄者，破财之后方能重建，财运终归好转，主晚年成就。」 (Phá Quân thủ Mệnh, một đời nhiều trắc trở; Hóa Lộc thì sau khi hao tài mới có thể gây dựng lại, tài vận rốt cuộc chuyển tốt, chủ thành tựu lúc về già.)',
    bestPalace: 'Quan Lộc (Hóa Lộc), Thiên Di',
    worstPalace: 'Phu Thê, Phụ Mẫu',
    career: 'Sự nghiệp khai sáng, quân đội, cảnh sát, cải cách, quản trị thay đổi; hợp công việc tiên phong không ngừng mở mang lĩnh vực mới',
    relationship: 'Tình cảm nhiều sóng gió, hợp tan bất định, duyên lục thân mỏng; cần chọn bạn đời độc lập và bao dung',
    wealth: 'Tài vận lên xuống lớn, Hóa Lộc thì tài vận chuyển tốt; chỉ giữ thì tài lui, phải không ngừng mở cục diện mới mới tích được của',
    health: 'Hành Thủy, chú ý thận, bàng quang, hệ sinh dục. Thể trạng thất thường, nên duy trì thói quen vận động đều đặn',
  },
};

const levelConfig = {
  major: { label: 'Chính tinh', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  lucky: { label: 'Cát tinh', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  sha:   { label: 'Sát tinh', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  minor: { label: 'Tạp tinh', color: 'text-slate-400 border-slate-500/25 bg-slate-500/10' },
};

const siHuaColors: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

const BRIGHT_LABEL = 'Miếu Vượng';
const DIM_LABEL = 'Lạc Hãm';

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const desc = star ? STAR_DESCRIPTIONS[star.name] : null;
  const detail = star ? STAR_DETAIL[star.name] : null;
  const typeConfig = star ? levelConfig[star.type] : null;

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}>{viTerm(star.name)}</span>
              {typeConfig && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
              {star.siHua && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  Hóa {viTerm(star.siHua)}
                </span>
              )}
            </div>
            <button onClick={onClose} className="transition-colors text-lg leading-none" style={{ color: 'var(--t-faint)' }}>×</button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
            {/* 基本信息 */}
            {desc && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  `Ngũ hành · ${desc.element}`,
                  `Tính chất · ${desc.nature}`,
                  ...(palaceName ? [`Vị trí · ${viTerms(palaceName)}`] : []),
                  ...(star.brightness ? [star.brightness === 'bright' ? BRIGHT_LABEL : star.brightness === 'dim' ? DIM_LABEL : 'Bình Hòa'] : []),
                ].map(tag => (
                  <div key={tag} className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--t-border)',
                      color: tag === BRIGHT_LABEL ? '#eab308' : tag === DIM_LABEL ? '#ef4444' : 'var(--t-text2)',
                    }}>
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* 关键词 */}
            {desc && (
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>Đặc tính tinh diệu</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.split('·').map(k => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {k.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 古书原文 */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)', opacity: 0.7 }}>
                  Nguyên văn cổ thư
                </div>
                <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--t-gold)', opacity: 0.8 }}>{detail.classical}</p>
              </div>
            )}

            {/* 倪海厦解读 */}
            {detail && (
              <>
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    Luận giải của thầy Nghê Hải Hạ
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Hướng sự nghiệp', value: detail.career, icon: '◈' },
                    { label: 'Đặc điểm tình cảm', value: detail.relationship, icon: '♡' },
                    { label: 'Phân tích tài vận', value: detail.wealth, icon: '◆' },
                    { label: 'Lưu ý sức khỏe', value: detail.health, icon: '☯' },
                  ].map(item => (
                    <div key={item.label} className="card-inner rounded-lg p-3">
                      <div className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--t-faint)' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.05)' }}>
                    <div className="text-emerald-500 mb-0.5 font-medium">Cung vị tốt nhất</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">Cung vị cần lưu ý</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* 辅星/煞星说明 */}
            {!detail && star.type !== 'major' && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
                {star.type === 'lucky' && (
                  <>
                    {star.name === '文昌' && 'Văn Xương nhập cung, chủ học hành thi cử thuận lợi, giấy tờ ấn tín hanh thông, hợp làm công việc liên quan đến chữ nghĩa. Cổ quyết: 「文昌科甲，主文章显达，逢考必第。」 (Văn Xương chủ khoa giáp, văn chương hiển đạt, thi ắt đỗ.)'}
                    {star.name === '文曲' && 'Văn Khúc nhập cung, chủ tài nghệ xuất chúng, ăn nói giỏi, khéo biểu đạt, năng khiếu nghệ thuật mạnh. Cổ quyết: 「文曲为才艺之星，能文能武，口才胜人。」 (Văn Khúc là sao tài nghệ, văn võ song toàn, tài ăn nói hơn người.)'}
                    {star.name === '左辅' && 'Tả Phù nhập cung, chủ quý nhân phù trợ, có người nâng đỡ, các việc thuộc cung này được hỗ trợ thiện ý. Cổ quyết: 「左辅为助力之星，坐命则贵人多，逢凶化吉。」 (Tả Phù là sao trợ lực, thủ Mệnh thì nhiều quý nhân, gặp hung hóa cát.)'}
                    {star.name === '右弼' && 'Hữu Bật nhập cung, chủ quý nhân phù trợ, phần nhiều là quý nhân nữ, các việc thuộc cung này có người giúp đỡ. Cổ quyết: 「右弼为阴助之星，多女性贵人，化险为夷。」 (Hữu Bật là sao âm trợ, nhiều quý nhân nữ, chuyển nguy thành an.)'}
                    {star.name === '天魁' && 'Thiên Khôi nhập cung, chủ quý nhân của người sinh ban ngày, phần nhiều là quý nhân nam, có sức gặp hung hóa cát. Cổ quyết: 「天魁为天乙贵人，逢之必有贵人扶持。」 (Thiên Khôi là Thiên Ất quý nhân, gặp ắt có quý nhân nâng đỡ.)'}
                    {star.name === '天钺' && 'Thiên Việt nhập cung, chủ quý nhân của người sinh ban đêm, phần nhiều là quý nhân nữ, tăng thêm khí cát tường. Cổ quyết: 「天钺为玉堂贵人，主阴助，女贵人多。」 (Thiên Việt là Ngọc Đường quý nhân, chủ âm trợ, nhiều quý nhân nữ.)'}
                    {star.name === '禄存' && 'Lộc Tồn nhập cung, chủ tài lộc thủ thành, cung này có tài khí nhưng thuộc kiểu tài vận bảo thủ. Cổ quyết: 「禄存为财禄之星，主守财有余，进财稳健。」 (Lộc Tồn là sao tài lộc, chủ giữ của có thừa, tiền vào vững vàng.)'}
                    {star.name === '天马' && 'Thiên Mã nhập cung, chủ bôn ba biến động, cầu tài trong sự dịch chuyển, nên chủ động hành động, không nên ôm cây đợi thỏ. Cổ quyết: 「天马主动，逢禄则财禄双全，动中生财。」 (Thiên Mã chủ động, gặp Lộc thì tài lộc song toàn, trong động sinh tài.)'}
                  </>
                )}
                {star.type === 'sha' && (
                  <>
                    {star.name === '地空' && 'Địa Không nhập cung, chủ các việc thuộc cung này dễ có cảm giác hụt hẫng, tinh thần hao tán, nên chú ý sức khỏe tâm lý. Cổ quyết: 「地空主虚耗，入命宫者多精神迷茫，须防空想。」 (Địa Không chủ hư hao, nhập Mệnh thì tinh thần hay mơ hồ, phải phòng mộng tưởng viển vông.)'}
                    {star.name === '地劫' && 'Địa Kiếp nhập cung, chủ các việc thuộc cung này có tổn thất bất ngờ, tiền của cần thận trọng, đề phòng tiểu nhân. Cổ quyết: 「地劫主劫财，入命宫者财运受损，防意外之失。」 (Địa Kiếp chủ kiếp tài, nhập Mệnh thì tài vận bị tổn hại, phòng mất mát bất ngờ.)'}
                    {star.name === '火星' && 'Hỏa Tinh nhập cung, chủ các việc thuộc cung này nóng vội bốc đồng, cảm xúc dao động, nhưng nếu gặp Tham Lang thì lại thành cát. Cổ quyết: 「火星主急燥，然遇贪狼同宫，反为火贪格，主暴发。」 (Hỏa Tinh chủ nóng nảy, nhưng gặp Tham Lang đồng cung lại thành cách Hỏa Tham, chủ bạo phát.)'}
                    {star.name === '铃星' && 'Linh Tinh nhập cung, chủ các việc thuộc cung này có trở ngại ngầm, đề phòng tiểu nhân sau lưng, mọi việc nên kín đáo. Cổ quyết: 「铃星主暗煞，入命者多暗中受敌，须防背后是非。」 (Linh Tinh chủ hung sát ngầm, nhập Mệnh thì hay bị kẻ thù trong tối, phải phòng thị phi sau lưng.)'}
                    {star.name === '擎羊' && 'Kình Dương nhập cung, chủ hình khắc, các việc thuộc cung này nhiều trắc trở, có tai họa huyết quang hoặc tai nạn. Cổ quyết: 「擎羊为刑克之星，入命宫者多刑克，须防意外血光。」 (Kình Dương là sao hình khắc, nhập Mệnh thì nhiều hình khắc, phải phòng tai nạn huyết quang.)'}
                    {star.name === '陀罗' && 'Đà La nhập cung, chủ thị phi đeo bám, các việc thuộc cung này dây dưa không dứt, mọi việc nên chuẩn bị sớm. Cổ quyết: 「陀罗主是非拖延，入命宫者做事迟缓，须防纠缠不清。」 (Đà La chủ thị phi trì hoãn, nhập Mệnh thì làm việc chậm chạp, phải phòng vướng mắc dây dưa.)'}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
