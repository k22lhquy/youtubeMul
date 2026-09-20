# SyncScreen

Web xem video cùng nhau: một người tạo phòng, gửi link mời, mọi người tự phát cùng một URL YouTube, MP4 hoặc HLS. Tất cả thành viên có thể điều khiển play, pause, seek; các client tự sửa lệch thời gian.

## Chạy local

```bash
npm install
npm run db:up
npm run build
npm start
```

Mở `http://localhost:3000`. Khi code giao diện: chạy `npm start` và, ở terminal khác, chạy `npm run dev` rồi mở `http://localhost:5173`.

1. Nhập tên và URL YouTube, MP4 hoặc HLS (`.m3u8`) có thể truy cập từ trình duyệt.
2. Tạo phòng rồi bấm **Sao chép link mời**.
3. Người khác mở link, nhập tên và tham gia. Không cần nhập lại URL video.

Mở hai cửa sổ trình duyệt để thử. Trình duyệt có thể yêu cầu người xem bấm Play lần đầu vì chính sách autoplay.

## Cấu trúc

```
src/
  controllers/  # auth + Socket.IO room controller
  middleware/   # kiểm tra JWT trên Socket.IO handshake
  models/       # RoomStore in-memory
  routes/       # REST routes
client/src/
  components/   # Lobby, VideoPlayer, RoomPanel
  hooks/        # useWatchRoom
```

- Backend: Express MVC, Socket.IO, PostgreSQL, tài khoản/password hash bằng scrypt và JWT.
- Frontend: React, Vite, Tailwind CSS và custom hook `useWatchRoom`.
- PostgreSQL lưu guest và trạng thái phòng; thành viên đang online vẫn nằm trong RAM vì socket là kết nối tạm thời.

Database local chạy bằng Docker Compose tại `127.0.0.1:5432`. Cấu hình mặc định nằm trong `compose.yaml`; sao chép `.env.example` thành `.env` nếu muốn đổi connection string hoặc JWT secret.

## Đồng bộ

- Server giữ trạng thái chuẩn: URL, play/pause, vị trí và timestamp.
- Mọi thành viên đều có thể gửi lệnh điều khiển.
- Người xem lấy chênh lệch đồng hồ với server mỗi 5 giây.
- Lệch 250 ms–1 giây: chỉnh playback rate nhẹ (`0.96` / `1.04`).
- Lệch trên 1 giây: seek về vị trí chuẩn.

## Video và production

Ứng dụng **không truyền file video qua Socket.IO**. Mỗi người xem tải video trực tiếp từ nguồn URL. Để ít giật:

- Lưu video ở object storage và phân phối qua CDN.
- Transcode sang HLS nhiều bitrate.
- Dùng URL ký tạm thời nếu video riêng tư.
- Proxy production phải cho phép WebSocket upgrade.

Trạng thái room được lưu PostgreSQL. Danh sách socket online nằm trong RAM nên chưa phù hợp nhiều instance; khi cần scale, thêm Redis adapter cho Socket.IO.

## Deploy Railway

Repository đã có `Dockerfile`; Railway tự nhận diện nó. Trong Railway Dashboard, tạo **New Project** → **Deploy from GitHub repo** → chọn `k22lhquy/youtubeMul` → **Deploy Now**. Sau khi build xong, vào service settings và chọn **Generate Domain**.

Railway tự deploy lại mỗi khi có commit mới trên `main`. Railway tự cấp `PORT`; thêm `JWT_SECRET` ngẫu nhiên khi deploy production.

## Kiểm tra

```bash
npm test
```

Test hiện có xác nhận mọi thành viên đều có thể sync seek đến cả phòng.

## Giới hạn hiện tại

- Chưa có chat hay upload video local.
- Chỉ dùng video bạn có quyền chia sẻ; không rehost hoặc vượt điều khoản nguồn video.
