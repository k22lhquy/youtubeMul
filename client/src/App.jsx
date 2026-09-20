import { useEffect, useRef, useState } from "react";
import { AuthForm } from "./components/AuthForm";
import { Lobby } from "./components/Lobby";
import { RoomPanel } from "./components/RoomPanel";
import { VideoPlayer } from "./components/VideoPlayer";
import { useWatchRoom } from "./hooks/useWatchRoom";

export default function App() {
  const playerRef = useRef();
  const joiningRef = useRef(false);
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem("syncscreen-session") || "null"));
  const [invitation] = useState(() => {
    const [roomId, query = ""] = location.hash.slice(1).split("?");
    return { roomId: roomId.toUpperCase(), inviteToken: new URLSearchParams(query).get("invite") };
  });
  const initialRoomId = invitation.roomId;
  const { room, status, error, messages, join, action, control, rename, sendChat, uploadAndLoad, syncPlayback, reportError } = useWatchRoom(playerRef);
  const saveSession = (next) => { localStorage.setItem("syncscreen-session", JSON.stringify(next)); setSession(next); };
  const logout = () => { localStorage.removeItem("syncscreen-session"); location.assign("/"); };
  useEffect(() => {
    if (!session || !initialRoomId || joiningRef.current) return;
    joiningRef.current = true;
    join({ token: session.token, roomId: initialRoomId, inviteToken: invitation.inviteToken });
  }, [initialRoomId, invitation.inviteToken, join, session]);
  if (!session) return <main className="mx-auto flex min-h-screen max-w-md items-center p-6"><section className="w-full space-y-5"><h1 className="text-4xl font-black">SyncScreen</h1><p className="text-slate-300">Đăng nhập để tạo hoặc tham gia phòng.</p><AuthForm onSession={saveSession} /></section></main>;
  if (!room && initialRoomId) return <main className="grid min-h-screen place-items-center p-6"><div className="text-center"><p>{error || `Đang vào phòng ${initialRoomId}…`}</p>{error && <a href="/" className="mt-4 inline-block text-violet-300">Về trang chủ</a>}</div></main>;
  if (!room) return <Lobby onJoin={join} error={error} session={session} onLogout={logout} />;
  return <main className="mx-auto min-h-screen max-w-7xl p-6"><header className="mb-6 flex items-center justify-between"><a href="/" className="font-black tracking-widest">SYNCSCREEN</a><div className="flex items-center gap-3"><span className="text-slate-400">{room.members.find((member) => member.id === room.selfId)?.name}</span><button onClick={logout}>Đăng xuất</button></div></header><div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><VideoPlayer playerRef={playerRef} url={room.state.videoUrl} onAction={action} onReady={syncPlayback} onError={reportError} /><RoomPanel room={room} status={status} error={error} messages={messages} onRename={rename} onSend={sendChat} onPlay={() => control("play")} onPause={() => control("pause")} onLoad={(videoUrl) => control("load", { videoUrl })} onUpload={uploadAndLoad} /></div></main>;
}
