# Dmanhz Social Network

Project nâng cấp từ `login_web-main`: Express + HTML/CSS/JavaScript thuần.

## Chạy
```bash
npm install
npm start
```
Mở http://localhost:3000

Tài khoản demo:
- `dmanhz` / `12345`
- `minhanh` / `123`
- `quochuy` / `123`
- `khanhlinh` / `123`
- `giabao` / `123`

## Tính năng
- Đăng ký / đăng nhập / đăng xuất.
- Community Feed: tạo bài, URL ảnh, like, comment, chia sẻ liên kết.
- Tìm kiếm người dùng và bài viết.
- Chat 1-1: danh sách hội thoại, tin nhắn, trạng thái online, unread count.
- Thông báo: like, comment, message, đánh dấu đã đọc.
- Chỉnh sửa profile: tên, bio, avatar URL.
- Responsive desktop/tablet/mobile.

## Kiến trúc dữ liệu
Demo dùng `data/db.json` để chạy ngay, phù hợp đồ án/local demo. Khi triển khai thật nên thay bằng MySQL/PostgreSQL/MongoDB, hash password, session/JWT, upload ảnh và WebSocket cho realtime.
# Social-web
