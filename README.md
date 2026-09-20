# SyncScreen

Web xem video cùng nhau: host tạo phòng, gửi link mời, mọi người tự phát cùng một URL YouTube, MP4 hoặc HLS. Host điều khiển play, pause, seek; các client tự sửa lệch thời gian.

## Chạy local

```bash
npm install
npm run db:up
npm run build
npm start
```

Mở `http://localhost:3000`. Khi code giao diện: chạy `npm start` và, ở terminal khác, chạy `npm run dev` rồi mở `http://localhost:5173`.

1. Host nhập tên và URL YouTube, MP4 hoặc HLS (`.m3u8`) có thể truy cập từ trình duyệt.
2. Host tạo phòng rồi bấm **Sao chép link mời**.
3. Người khác mở link sẽ vào thẳng phòng bằng tên khách tự tạo và có thể đổi tên trong phòng.

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
- Chỉ host gửi lệnh điều khiển.
- Người xem lấy chênh lệch đồng hồ với server mỗi 5 giây.
- Người mới vào đồng bộ đồng hồ và vị trí phát ngay từ trạng thái phòng đầu tiên.
- Lệch 250 ms–1 giây: chỉnh playback rate nhẹ (`0.96` / `1.04`).
- Lệch trên 1 giây: seek về vị trí chuẩn.
- Host rời phòng: người vào sớm nhất thành host mới.

## Video và production

Video upload local đi qua HTTP streaming, tối đa 1 GB và được lưu trong `uploads/`; Socket.IO chỉ đồng bộ điều khiển. Mỗi người xem tải video trực tiếp từ URL. Để ít giật:

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

Test hiện có xác nhận host sync seek đến guest và quyền host được chuyển khi host rời phòng.

## Giới hạn hiện tại

- Chỉ dùng video bạn có quyền chia sẻ; không rehost hoặc vượt điều khoản nguồn video.
