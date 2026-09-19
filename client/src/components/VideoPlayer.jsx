import { useEffect, useRef } from "react";
import Hls from "hls.js";

export function VideoPlayer({ playerRef, url, onAction, onReady }) {
  const hlsRef = useRef();
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !url) return;
    hlsRef.current?.destroy();
    if (/\.m3u8($|\?)/i.test(url) && Hls.isSupported()) { const hls = new Hls({ enableWorker: true, lowLatencyMode: true }); hls.loadSource(url); hls.attachMedia(player); hlsRef.current = hls; }
    else player.src = url;
    return () => hlsRef.current?.destroy();
  }, [playerRef, url]);
  return <video ref={playerRef} className="aspect-video w-full rounded-xl bg-black" controls playsInline onLoadedMetadata={onReady} onPlay={() => onAction("play")} onPause={() => onAction("pause")} onSeeked={() => onAction("seek")} />;
}
