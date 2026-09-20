import { useRef, useState } from "react";
import { Lobby } from "./components/Lobby";
import { RoomPanel } from "./components/RoomPanel";
import { VideoPlayer } from "./components/VideoPlayer";
import { useWatchRoom } from "./hooks/useWatchRoom";

export default function App() {
  const playerRef = useRef();
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem("syncscreen-session") || "null"));
  const initialRoomId = location.hash.slice(1).toUpperCase();
  const { room, status, error, messages, join, action, control, sendChat, uploadAndLoad, syncPlayback, reportError } = useWatchRoom(playerRef);
  const saveSession = (next) => { localStorage.setItem("syncscreen-session", JSON.stringify(next)); setSession(next); };
  const logout = () => { localStorage.removeItem("syncscreen-session"); setSession(null); };
  if (!room) return <Lobby initialRoomId={initialRoomId} onJoin={join} error={error} session={session} onSession={saveSession} onLogout={logout} />;
  return <main className="mx-auto min-h-screen max-w-7xl p-6"><header className="mb-6 flex items-center justify-between"><a href="/" className="font-black tracking-widest">SYNCSCREEN</a><span className="text-slate-400">{session?.user.name || "Khách"}</span></header><div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><VideoPlayer playerRef={playerRef} url={room.state.videoUrl} onAction={action} onReady={syncPlayback} onError={reportError} /><RoomPanel room={room} status={status} error={error} messages={messages} onSend={sendChat} onPlay={() => control("play")} onPause={() => control("pause")} onLoad={(videoUrl) => control("load", { videoUrl })} onUpload={uploadAndLoad} /></div></main>;
}
