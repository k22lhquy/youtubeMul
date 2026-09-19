import { useState } from "react";

export function Lobby({ initialRoomId, onJoin, error }) {
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const joiningExistingRoom = Boolean(initialRoomId);
  const submit = (event) => { event.preventDefault(); onJoin({ name, roomId: initialRoomId || [...crypto.getRandomValues(new Uint8Array(6))].map((byte) => (byte % 36).toString(36)).join("").toUpperCase(), videoUrl }); };
  return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><section className="w-full"><p className="text-sm font-bold tracking-widest text-violet-300">SYNCED WATCH PARTY</p><h1 className="mt-2 text-5xl font-black">Xem cùng một khoảnh khắc.</h1><p className="mt-4 text-slate-300">{joiningExistingRoom ? `Tham gia phòng ${initialRoomId}. Video do host chọn.` : "Tạo phòng, gửi link, cùng xem video."}</p><form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-slate-900 p-6 shadow-2xl"><label className="block">Tên hiển thị<input required maxLength="32" value={name} onChange={(e) => setName(e.target.value)} placeholder="Quy" /></label><label className="block">URL video MP4/HLS {!joiningExistingRoom && <span className="text-slate-400">(host nhập)</span>}<input required={!joiningExistingRoom} type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/movie.mp4 hoặc .m3u8" /></label>{error && <p className="text-red-400">{error}</p>}<button>{joiningExistingRoom ? "Tham gia phòng" : "Tạo phòng"}</button></form></section></main>;
}
