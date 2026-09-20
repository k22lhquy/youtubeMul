import { useState } from "react";
import { AuthForm } from "./AuthForm";
import { RoomHistory } from "./RoomHistory";

export function Lobby({ onJoin, error, session, onSession, onLogout }) {
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState();
  const submit = (event) => { event.preventDefault(); onJoin({ name: session?.user.name || name, token: session?.token, roomId: [...crypto.getRandomValues(new Uint8Array(6))].map((byte) => (byte % 36).toString(36)).join("").toUpperCase(), videoUrl, videoFile }); };
  return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><section className="w-full space-y-6"><div><p className="text-sm font-bold tracking-widest text-violet-300">SYNCED WATCH PARTY</p><h1 className="mt-2 text-5xl font-black">Xem cùng một khoảnh khắc.</h1><p className="mt-4 text-slate-300">Tạo phòng, gửi link, cùng xem video.</p></div><AuthForm session={session} onSession={onSession} onLogout={onLogout} /><RoomHistory session={session} />{!session && <p className="text-center text-sm text-slate-400">Hoặc vào nhanh bằng tên khách</p>}<form onSubmit={submit} className="space-y-5 rounded-2xl bg-slate-900 p-6 shadow-2xl">{!session && <label className="block">Tên hiển thị<input required maxLength="32" value={name} onChange={(e) => setName(e.target.value)} placeholder="Quy" /></label>}<label className="block">URL YouTube, MP4 hoặc HLS <span className="text-slate-400">(host nhập)</span><input required={!videoFile} type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=… hoặc video trực tiếp" /></label><label className="block">Hoặc upload video local<input aria-label="Upload video" type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => setVideoFile(event.target.files[0])} /></label>{error && <p className="text-red-400">{error}</p>}<button>Tạo phòng</button></form></section></main>;
}
