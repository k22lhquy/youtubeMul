import { useRef } from "react";
import { Lobby } from "./components/Lobby";
import { RoomPanel } from "./components/RoomPanel";
import { VideoPlayer } from "./components/VideoPlayer";
import { useWatchRoom } from "./hooks/useWatchRoom";

export default function App() {
  const playerRef = useRef();
  const initialRoomId = location.hash.slice(1).toUpperCase();
  const { room, status, error, join, action, syncPlayback } = useWatchRoom(playerRef);
  if (!room) return <Lobby initialRoomId={initialRoomId} onJoin={join} error={error} />;
  return <main className="mx-auto min-h-screen max-w-7xl p-6"><header className="mb-6 flex items-center justify-between"><a href="/" className="font-black tracking-widest">SYNCSCREEN</a><span className="text-slate-400">JWT guest session</span></header><div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><VideoPlayer playerRef={playerRef} url={room.state.videoUrl} onAction={action} onReady={syncPlayback} /><RoomPanel room={room} status={status} error={error} onLoad={(videoUrl) => action("load", { videoUrl })} /></div></main>;
}
