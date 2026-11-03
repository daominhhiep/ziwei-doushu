export const metadata = { title: 'Chính sách quyền riêng tư · Lá Số Tử Vi', description: 'Chính sách quyền riêng tư của Lá Số Tử Vi' };

export default function PrivacyPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>Về trang chủ</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>Lá Số Tử Vi</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Chính sách quyền riêng tư</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật lần cuối: tháng 4/2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. Thông tin chúng tôi thu thập</h2>
      <p>Để cung cấp dịch vụ lập và luận giải lá số Tử Vi, chúng tôi có thể thu thập các thông tin sau:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Thông tin cần cho lá số</strong>: họ tên (không bắt buộc), ngày tháng năm sinh dương lịch, giờ sinh, giới tính, kinh độ nơi sinh</li>
        <li><strong>Thông tin tài khoản (sau khi đăng ký)</strong>: số điện thoại (dùng để xác minh qua SMS và cho dịch vụ thành viên)</li>
        <li><strong>Thông tin tương tác</strong>: lượt nhấp, lượt xem và lịch sử lá số của bạn trên trang</li>
        <li><strong>Thông tin phản hồi</strong>: đánh giá "Đúng / Không đúng" và góp ý bằng chữ của bạn về nội dung luận giải</li>
        <li><strong>Thông tin thanh toán</strong>: khi mua gói thành viên hoặc dịch vụ lẻ, giao dịch được xử lý qua bên thứ ba (Alipay / WeChat Pay); chúng tôi không lưu số thẻ đầy đủ hay mật khẩu</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. Cách chúng tôi sử dụng thông tin</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>Thông tin lá số chỉ dùng cho lần luận giải này và lịch sử lá số trong tài khoản của bạn</li>
        <li>Số điện thoại dùng để đăng ký, đăng nhập và thông báo đơn hàng</li>
        <li>Thông tin phản hồi dùng để liên tục cải thiện chất lượng nội dung (phân tích tổng hợp sau khi ẩn danh)</li>
        <li>Dữ liệu tổng hợp có thể được dùng cho nghiên cứu ngành và tối ưu Nền tảng</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Chia sẻ thông tin và bên thứ ba</h2>
      <p>Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba, trừ các trường hợp sau:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Nhà cung cấp thanh toán (Alipay / WeChat Pay): xử lý thanh toán đơn hàng</li>
        <li>Nhà cung cấp SMS (như Alibaba Cloud SMS): gửi mã xác minh</li>
        <li>Nhà cung cấp đám mây (như Vercel / Cloudflare / Alibaba Cloud): hạ tầng kỹ thuật</li>
        <li>Dịch vụ luận giải AI (như Anthropic Claude): xử lý các cuộc trò chuyện "Hỏi tự do" của bạn (đã ẩn danh)</li>
        <li>Yêu cầu hợp pháp của cơ quan tư pháp hoặc nhà nước theo quy định pháp luật</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. Bảo mật thông tin</h2>
      <p>Chúng tôi áp dụng các biện pháp kỹ thuật và quản lý phổ biến trong ngành để bảo vệ thông tin của bạn (mã hóa truyền tải HTTPS, mã hóa lưu trữ cơ sở dữ liệu, kiểm soát quyền truy cập...). Tuy vậy, việc truyền dữ liệu qua Internet không thể an toàn tuyệt đối.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Quyền của bạn</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Xem</strong>: xem toàn bộ lịch sử lá số và đơn hàng trong trang tài khoản</li>
        <li><strong>Xóa</strong>: liên hệ hỗ trợ để xóa lá số cụ thể hoặc hủy tài khoản</li>
        <li><strong>Xuất dữ liệu</strong>: yêu cầu xuất toàn bộ dữ liệu cá nhân của bạn</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Cookie và lưu trữ cục bộ</h2>
      <p>Trang web dùng cookie / localStorage để lưu: chế độ giao diện sáng/tối bạn chọn, lịch sử lá số gần đây và trạng thái đăng nhập. Bạn có thể tắt trong cài đặt trình duyệt, nhưng một số tính năng có thể bị ảnh hưởng.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Người chưa thành niên</h2>
      <p>Nội dung mệnh lý của Nền tảng dành cho người dùng từ 18 tuổi trở lên. Người chưa thành niên cần có sự đồng ý của người giám hộ khi sử dụng và không được dùng luận giải cho các quyết định lớn trong đời.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. Thay đổi chính sách</h2>
      <p>Chính sách này có thể được cập nhật định kỳ hoặc đột xuất. Thay đổi quan trọng sẽ được thông báo rõ ràng. Việc tiếp tục sử dụng đồng nghĩa với việc bạn đồng ý phiên bản đã cập nhật.</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>Điều khoản dịch vụ</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
