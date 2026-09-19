import { useState } from "react";

export function RoomPanel({ room, status, error, onLoad }) {
  const [videoUrl, setVideoUrl] = useState("");
  const copy = () => navigator.clipboard.writeText(location.href);
  return <aside className="space-y-5 rounded-xl bg-slate-900 p-5"><p className="font-bold text-violet-300">PHÒNG {room.roomId}</p><p>{status}</p><p className="text-slate-300">{room.isHost ? "Bạn là host." : "Host đang điều khiển video."}</p><p>{room.members.length} người: {room.members.map((m) => `${m.name}${m.isHost ? " (host)" : ""}`).join(", ")}</p><button onClick={copy}>Sao chép link mời</button>{room.isHost && <div className="space-y-2 border-t border-slate-700 pt-5"><input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="URL video mới" /><button onClick={() => videoUrl && onLoad(videoUrl)}>Đổi video</button></div>}{error && <p className="text-red-400">{error}</p>}</aside>;
}
