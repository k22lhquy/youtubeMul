import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { youtubeVideoId } from "../video-source.mjs";

let youtubeApi;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApi) return youtubeApi;
  youtubeApi = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return youtubeApi;
}

function NativePlayer({ playerRef, url, onAction, onReady, onError }) {
  const hlsRef = useRef();
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !url) return;
    hlsRef.current?.destroy();
    if (/\.m3u8($|\?)/i.test(url) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.on(Hls.Events.ERROR, (_, data) => data.fatal && onError("Không tải được luồng HLS."));
      hls.loadSource(url); hls.attachMedia(player); hlsRef.current = hls;
    }
    else player.src = url;
    return () => hlsRef.current?.destroy();
  }, [onError, playerRef, url]);
  return <video ref={playerRef} className="aspect-video w-full rounded-xl bg-black" controls playsInline onLoadedMetadata={() => onReady()} onError={() => onError("URL video không phát được hoặc máy chủ video đã chặn truy cập.")} onPlay={() => onAction("play")} onPause={() => onAction("pause")} onSeeked={() => onAction("seek")} />;
}

function YouTubePlayer({ playerRef, videoId, onAction, onReady, onError }) {
  const containerRef = useRef();
  const callbacks = useRef({ onAction, onReady, onError });
  callbacks.current = { onAction, onReady, onError };

  useEffect(() => {
    let player;
    let disposed = false;
    loadYouTubeApi().then((YT) => {
      if (!YT || disposed) return callbacks.current.onError("Không tải được YouTube Player API.");
      player = new YT.Player(containerRef.current, {
        videoId,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            playerRef.current = {
              canNudge: false,
              get currentTime() { return player.getCurrentTime() || 0; },
              set currentTime(value) { player.seekTo(value, true); },
              get paused() { return player.getPlayerState() !== YT.PlayerState.PLAYING; },
              get playbackRate() { return player.getPlaybackRate(); },
              set playbackRate(value) { player.setPlaybackRate(value); },
              play: () => { player.playVideo(); return Promise.resolve(); },
              pause: () => player.pauseVideo(),
            };
            callbacks.current.onReady();
          },
          onStateChange: ({ data }) => {
            player.getIframe().dataset.playerState = String(data);
            if (data === YT.PlayerState.PLAYING) callbacks.current.onAction("play");
            if (data === YT.PlayerState.PAUSED || data === YT.PlayerState.ENDED) callbacks.current.onAction("pause");
          },
          onError: () => { player.getIframe().dataset.playerError = "true"; callbacks.current.onError("Video YouTube này không cho phép phát nhúng."); },
        },
      });
    });
    return () => { disposed = true; playerRef.current = null; player?.destroy(); };
  }, [playerRef, videoId]);

  return <div className="aspect-video w-full overflow-hidden rounded-xl bg-black"><div ref={containerRef} className="h-full w-full" /></div>;
}

export function VideoPlayer(props) {
  const videoId = youtubeVideoId(props.url);
  return videoId ? <YouTubePlayer {...props} videoId={videoId} /> : <NativePlayer {...props} />;
}
