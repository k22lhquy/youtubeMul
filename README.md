# SyncScreen

Web xem video cùng nhau: host tạo phòng, gửi link mời, mọi người tự phát cùng một URL video. Host điều khiển play, pause, seek; các client tự sửa lệch thời gian.

## Chạy local

```bash
npm install
npm start
```

Mở `http://localhost:3000`.

1. Host nhập tên và URL MP4 hoặc HLS (`.m3u8`) có thể truy cập từ trình duyệt.
2. Host tạo phòng rồi bấm **Sao chép link mời**.
3. Người khác mở link, nhập tên và tham gia. Không cần nhập lại URL video.

Mở hai cửa sổ trình duyệt để thử. Trình duyệt có thể yêu cầu người xem bấm Play lần đầu vì chính sách autoplay.

## Đồng bộ

- Server giữ trạng thái chuẩn: URL, play/pause, vị trí và timestamp.
- Chỉ host gửi lệnh điều khiển.
- Người xem lấy chênh lệch đồng hồ với server mỗi 5 giây.
- Lệch 250 ms–1 giây: chỉnh playback rate nhẹ (`0.96` / `1.04`).
- Lệch trên 1 giây: seek về vị trí chuẩn.
- Host rời phòng: người vào sớm nhất thành host mới.

## Video và production

Ứng dụng **không truyền file video qua Socket.IO**. Mỗi người xem tải video trực tiếp từ nguồn URL. Để ít giật:

- Lưu video ở object storage và phân phối qua CDN.
- Transcode sang HLS nhiều bitrate.
- Dùng URL ký tạm thời nếu video riêng tư.
- Proxy production phải cho phép WebSocket upgrade.

MVP giữ room trong RAM, nên room bị mất khi server restart và không phù hợp nhiều instance. Khi cần scale: thay room state bằng Redis và dùng adapter Socket.IO cho Redis.

## Kiểm tra

```bash
npm test
```

Test hiện có xác nhận host sync seek đến guest và quyền host được chuyển khi host rời phòng.

## Giới hạn hiện tại

- Chưa có đăng nhập, chat, upload hay lịch sử phòng.
- Chỉ dùng video bạn có quyền chia sẻ; không rehost hoặc vượt điều khoản nguồn video.
