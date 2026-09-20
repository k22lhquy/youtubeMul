import { useState } from "react";
import { ChatPanel } from "./ChatPanel";

export function RoomPanel({ room, status, error, messages, onRename, onSend, onPlay, onPause, onLoad, onUpload }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(room.members.find((member) => member.id === room.selfId)?.name || "");
  const inviteUrl = `${location.origin}/#${room.roomId}?invite=${encodeURIComponent(room.inviteToken)}`;
  const copy = async () => {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(inviteUrl);
    else {
      const input = Object.assign(document.createElement("textarea"), { value: inviteUrl });
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
  };
  return <aside className="space-y-5 rounded-xl bg-slate-900 p-5"><p className="font-bold text-violet-300">PHÒNG {room.roomId}</p><p>{status}</p><p className="text-slate-300">Mọi thành viên đều có thể chọn và điều khiển video.</p><p>{room.members.length} người: {room.members.map((m) => `${m.name}${m.isHost ? " (host)" : ""}`).join(", ")}</p><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); onRename(name); }}><input aria-label="Tên hiển thị" required minLength="2" maxLength="32" value={name} onChange={(event) => setName(event.target.value)} /><button>Đổi tên</button></form><label className="block">Link mời<input readOnly value={inviteUrl} /></label><button onClick={copy}>{copied ? "Đã sao chép link phòng" : "Sao chép link mời"}</button><div className="space-y-3 border-t border-slate-700 pt-5"><div className="flex gap-2"><button onClick={onPlay}>Phát</button><button onClick={onPause}>Tạm dừng</button></div><input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Dán link YouTube hoặc video" /><button onClick={() => videoUrl && onLoad(videoUrl)}>Chọn video</button><label className="block">Upload video mới<input type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => event.target.files[0] && onUpload(event.target.files[0])} /></label></div><ChatPanel messages={messages} onSend={onSend} />{error && <p className="text-red-400">{error}</p>}</aside>;
}
