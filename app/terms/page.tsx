export const metadata = { title: 'Điều khoản dịch vụ · Lá Số Tử Vi', description: 'Điều khoản dịch vụ và thỏa thuận người dùng của Lá Số Tử Vi' };

export default function TermsPage() {
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
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Điều khoản dịch vụ</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật lần cuối: tháng 4/2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. Tổng quan dịch vụ</h2>
      <p>Lá Số Tử Vi (sau đây gọi là "Nền tảng") cung cấp dịch vụ lập và luận giải lá số dựa trên hệ thống Tử Vi Đẩu Số trong «Thiên Kỷ» của Nghê Hải Hạ. Mọi nội dung mệnh lý trên Nền tảng chỉ mang tính tham khảo, <strong>không phải là lời khuyên y tế, đầu tư, pháp lý, tư vấn tâm lý hay cho các quyết định lớn trong đời</strong>.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. Quy tắc sử dụng</h2>
      <p>Khi sử dụng Nền tảng, bạn đồng ý:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Chỉ sử dụng Nền tảng cho mục đích hợp pháp và tham khảo cá nhân</li>
        <li>Không phát tán nội dung của Nền tảng để bán, đăng lại hoặc công bố công khai</li>
        <li>Không có hành vi gây ảnh hưởng đến hoạt động bình thường của Nền tảng</li>
        <li>Thông tin ngày sinh bạn cung cấp là chính xác; Nền tảng không chịu trách nhiệm về sai lệch luận giải do thông tin sai</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Sở hữu trí tuệ và các hành vi bị cấm · Chống thu thập và huấn luyện</h2>
      <p style={{ background: 'rgba(168,50,40,0.06)', border: '1px solid rgba(168,50,40,0.2)', padding: 16, borderRadius: 8 }}>
        <strong>Toàn bộ nội dung mệnh lý, kho kiến thức (gồm mọi văn bản luận giải 14 chính tinh × 12 cung × nam nữ × Tứ Hóa × đại hạn lưu niên), thiết kế giao diện, giải pháp tích hợp thuật toán và kho ví dụ đều do Nền tảng tự xây dựng hoặc biên soạn hợp pháp.</strong><br/><br/>
        Nghiêm cấm các hành vi sau; Nền tảng bảo lưu quyền yêu cầu bồi thường dân sự và truy cứu trách nhiệm hình sự đối với người vi phạm:<br/>
        ① Thu thập nội dung của Nền tảng bằng bất kỳ phương tiện kỹ thuật nào như crawler, script tự động, gọi API hàng loạt;<br/>
        ② **Dùng để huấn luyện bất kỳ mô hình học máy nào** các luận giải lá số, văn bản, dữ liệu phản hồi API do Nền tảng tạo ra (bao gồm nhưng không giới hạn ở mô hình ngôn ngữ lớn, mô hình tạo nội dung mệnh lý, mô hình tạo văn bản);<br/>
        ③ Bán lại hoặc đăng nội dung do Nền tảng tạo ra lên trang web, ứng dụng hoặc tài khoản mạng xã hội khác;<br/>
        ④ Dịch ngược, sao chép, sửa đổi mã nguồn frontend hoặc backend của Nền tảng để tự cung cấp dịch vụ tương tự.<br/><br/>
        Văn bản do Nền tảng tạo ra có gắn dấu vết nhận dạng; nội dung sao chép hoặc huấn luyện trái phép có thể bị phát hiện và truy vết. Khi phát hiện vi phạm, Nền tảng có quyền yêu cầu <strong>bồi thường 1 triệu nhân dân tệ cho mỗi trường hợp</strong>, đồng thời bảo lưu quyền khởi kiện ra tòa và phối hợp với cơ quan công an điều tra.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. Miễn trừ trách nhiệm</h2>
      <p>Nội dung mệnh lý của Nền tảng được biên soạn từ kiến thức Tử Vi Đẩu Số truyền thống và hệ thống của Nghê Hải Hạ, <strong>không đảm bảo chính xác 100%</strong>. Vận mệnh chịu ảnh hưởng chung của tam tài Thiên, Địa, Nhân; kết quả của Nền tảng chỉ là tham khảo để hiểu bản thân. Hãy xem xét một cách lý trí và đừng quá phụ thuộc vào bất kỳ nhận định mệnh lý đơn lẻ nào.</p>
      <p>Nền tảng không chịu trách nhiệm pháp lý đối với bất kỳ hệ quả nào phát sinh từ việc sử dụng nội dung (bao gồm nhưng không giới hạn ở quyết định sai lầm, ảnh hưởng tâm lý, thay đổi trong các mối quan hệ).</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Thay đổi và chấm dứt dịch vụ</h2>
      <p>Nền tảng có quyền điều chỉnh, tạm dừng hoặc chấm dứt một phần hay toàn bộ dịch vụ bất cứ lúc nào. Các thay đổi quan trọng sẽ được thông báo trên trang hoặc qua email.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Luật áp dụng và giải quyết tranh chấp</h2>
      <p>Điều khoản này áp dụng pháp luật nước Cộng hòa Nhân dân Trung Hoa. Khi có tranh chấp, hai bên sẽ thương lượng thiện chí; nếu không thành, tranh chấp sẽ được đưa ra tòa án nhân dân có thẩm quyền tại nơi đơn vị vận hành Nền tảng đặt trụ sở.</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Liên hệ</h2>
      <p>Nếu có thắc mắc, vui lòng liên hệ qua WeChat hoặc email chăm sóc khách hàng được công bố trên Nền tảng.</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>Chính sách quyền riêng tư</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
