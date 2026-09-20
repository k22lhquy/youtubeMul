import { useState } from "react";
import { RoomHistory } from "./RoomHistory";

export function Lobby({ onJoin, error, session, onLogout }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState();
  const [createPassword, setCreatePassword] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const create = (event) => { event.preventDefault(); onJoin({ token: session.token, roomId: [...crypto.getRandomValues(new Uint8Array(6))].map((byte) => (byte % 36).toString(36)).join("").toUpperCase(), videoUrl, videoFile, password: createPassword }); };
  const enter = (event) => { event.preventDefault(); onJoin({ token: session.token, roomId: roomCode, password: joinPassword }); };
  return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><section className="w-full space-y-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold tracking-widest text-violet-300">SYNCED WATCH PARTY</p><h1 className="mt-2 text-5xl font-black">Xem cùng một khoảnh khắc.</h1></div><button onClick={onLogout}>Đăng xuất</button></div><RoomHistory session={session} /><form onSubmit={create} className="space-y-5 rounded-2xl bg-slate-900 p-6 shadow-2xl"><h2 className="text-xl font-bold">Tạo host mới</h2><label className="block">URL YouTube, MP4 hoặc HLS<input required={!videoFile} type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=… hoặc video trực tiếp" /></label><label className="block">Mật khẩu host (không bắt buộc)<input type="password" minLength="4" maxLength="128" value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} /></label><label className="block">Hoặc upload video local<input aria-label="Upload video" type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => setVideoFile(event.target.files[0])} /></label><button>Tạo host</button></form><form onSubmit={enter} className="space-y-4 rounded-2xl bg-slate-900 p-6"><h2 className="text-xl font-bold">Vào host bằng mã</h2><label className="block">Mã host<input required maxLength="32" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} /></label><label className="block">Mật khẩu host<input type="password" maxLength="128" value={joinPassword} onChange={(event) => setJoinPassword(event.target.value)} /></label><button>Vào host</button></form>{error && <p className="text-red-400">{error}</p>}</section></main>;
}
