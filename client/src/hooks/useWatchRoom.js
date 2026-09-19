import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { guestToken } from "../api";

export function useWatchRoom(playerRef) {
  const socketRef = useRef();
  const applyingRef = useRef(0);
  const clockOffset = useRef(0);
  const [room, setRoom] = useState();
  const [status, setStatus] = useState("Sẵn sàng tạo phòng");
  const [error, setError] = useState("");

  const expectedPosition = useCallback((next = room) => {
    if (!next) return 0;
    return Math.max(0, next.state.position + (next.state.playing ? (Date.now() + clockOffset.current - next.state.changedAt) / 1000 : 0));
  }, [room]);

  const syncPlayback = useCallback((next = room) => {
    const player = playerRef.current;
    if (!player || !next) return;
    const drift = expectedPosition(next) - player.currentTime;
    applyingRef.current = Date.now() + 700;
    if (Math.abs(drift) > 1 || (Math.abs(drift) > 0.25 && player.canNudge === false)) player.currentTime = expectedPosition(next);
    else if (Math.abs(drift) > 0.25 && !next.isHost) {
      player.playbackRate = drift > 0 ? 1.04 : 0.96;
      window.setTimeout(() => { player.playbackRate = 1; }, 1800);
    }
    if (next.state.playing && player.paused) player.play().catch(() => setStatus("Bấm play để trình duyệt cho phép phát"));
    if (!next.state.playing && !player.paused) player.pause();
  }, [expectedPosition, playerRef, room]);

  useEffect(() => { syncPlayback(); }, [room, syncPlayback]);
  useEffect(() => () => socketRef.current?.close(), []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      const sentAt = Date.now();
      socket.emit("clock-ping", null, (serverNow) => { clockOffset.current = serverNow - (sentAt + Date.now()) / 2; });
      if (room && !room.isHost) syncPlayback();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [room, syncPlayback]);

  const join = useCallback(async ({ name, roomId, videoUrl }) => {
    setError(""); setStatus("Đang kết nối…");
    try {
      const token = await guestToken(name);
      const socket = io({ auth: { token } });
      socketRef.current = socket;
      socket.on("room-state", (next) => { setRoom(next); setStatus(next.state.playing ? "Đang phát đồng bộ" : "Đã tạm dừng đồng bộ"); });
      socket.on("room-error", setError);
      socket.on("connect_error", () => setError("Phiên đăng nhập không hợp lệ hoặc server không phản hồi."));
      socket.on("disconnect", () => setStatus("Mất kết nối, đang thử lại…"));
      socket.on("connect", () => socket.emit("join-room", { roomId, videoUrl }, (next) => {
        if (next.error) return setError(next.error);
        history.replaceState({}, "", `/#${next.roomId}`);
        setRoom(next);
      }));
    } catch (err) { setError(err.message); }
  }, []);

  const action = useCallback((action, extra = {}, force = false) => {
    const player = playerRef.current;
    if (!room?.isHost || (!force && (!player || Date.now() < applyingRef.current))) return;
    socketRef.current?.emit("room-action", { action, position: player?.currentTime ?? expectedPosition(), ...extra });
  }, [expectedPosition, playerRef, room]);

  const control = useCallback((name, extra = {}) => action(name, extra, true), [action]);
  return { room, status, error, join, action, control, syncPlayback, reportError: setError };
}
