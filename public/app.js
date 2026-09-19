const form = document.querySelector("#room-form");
const lobby = document.querySelector("#lobby");
const watchRoom = document.querySelector("#watch-room");
const player = document.querySelector("#player");
const roomCode = document.querySelector("#room-code");
const status = document.querySelector("#sync-status");
const people = document.querySelector("#people");
const videoInput = document.querySelector("#video-url");
const roomFromUrl = location.hash.slice(1).toUpperCase();

let socket;
let roomState;
let hls;
let clockOffset = 0;
let applyingUntil = 0;
let rateTimer;

if (roomFromUrl) {
  document.querySelector("#room-intro").textContent = `Tham gia phòng ${roomFromUrl}. Video do host chọn.`;
  document.querySelector("#join-button").textContent = "Tham gia phòng";
  document.querySelector("#video-required").textContent = "(không cần khi tham gia)";
  videoInput.required = false;
}

function setStatus(message, bad = false) {
  status.innerHTML = `<i class="${bad ? "bad" : ""}"></i> ${message}`;
}

function roomId() {
  return roomFromUrl || crypto.randomUUID().slice(0, 6).toUpperCase();
}

function expectedPosition() {
  if (!roomState) return 0;
  const elapsed = roomState.state.playing ? (Date.now() + clockOffset - roomState.state.changedAt) / 1000 : 0;
  return Math.max(0, roomState.state.position + elapsed);
}

function loadVideo(url) {
  if (player.dataset.url === url) return;
  player.dataset.url = url;
  if (hls) hls.destroy();
  hls = null;
  if (/\.m3u8($|\?)/i.test(url) && window.Hls?.isSupported()) {
    hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    hls.loadSource(url);
    hls.attachMedia(player);
  } else {
    player.src = url;
  }
}

function nudgePlayback(drift) {
  clearTimeout(rateTimer);
  player.playbackRate = drift > 0 ? 1.04 : 0.96;
  rateTimer = setTimeout(() => { player.playbackRate = 1; }, 1800);
}

function applyRoomState(nextState) {
  roomState = nextState;
  loadVideo(roomState.state.videoUrl);
  roomCode.textContent = `PHÒNG ${roomState.roomId}`;
  const target = expectedPosition();
  const drift = target - player.currentTime;
  applyingUntil = Date.now() + 700;
  if (Math.abs(drift) > 1) player.currentTime = target;
  else if (Math.abs(drift) > 0.25 && !roomState.isHost) nudgePlayback(drift);
  if (roomState.state.playing && player.paused) player.play().catch(() => setStatus("Bấm play để trình duyệt cho phép phát", true));
  if (!roomState.state.playing && !player.paused) player.pause();
  document.querySelector("#host-note").textContent = roomState.isHost ? "Bạn là host. Play, pause và seek sẽ đồng bộ cho mọi người." : "Host đang điều khiển. Ứng dụng tự sửa độ lệch thời gian.";
  document.querySelector("#change-video").classList.toggle("hidden", !roomState.isHost);
  people.innerHTML = `<strong>${roomState.members.length}</strong> người: ${roomState.members.map((member) => `${member.name}${member.isHost ? " (host)" : ""}`).join(", ")}`;
  setStatus(roomState.state.playing ? "Đang phát đồng bộ" : "Đã tạm dừng đồng bộ");
}

function calibrateClock() {
  if (!socket?.connected) return;
  const sentAt = Date.now();
  socket.emit("clock-ping", null, (serverNow) => {
    clockOffset = serverNow - (sentAt + Date.now()) / 2;
  });
}

function sendAction(action, extra = {}) {
  if (!roomState?.isHost || Date.now() < applyingUntil) return;
  socket.emit("room-action", { action, position: player.currentTime, ...extra });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = roomId();
  const name = document.querySelector("#name").value.trim();
  const videoUrl = videoInput.value.trim();
  socket = io();
  socket.on("connect", () => {
    socket.emit("join-room", { roomId: id, name, videoUrl }, (result) => {
      if (result.error) return setStatus(result.error, true);
      history.replaceState({}, "", `/#${id}`);
      lobby.classList.add("hidden");
      watchRoom.classList.remove("hidden");
      applyRoomState(result);
      calibrateClock();
    });
  });
  socket.on("room-state", applyRoomState);
  socket.on("room-error", (message) => setStatus(message, true));
  socket.on("disconnect", () => setStatus("Mất kết nối, đang thử lại…", true));
});

player.addEventListener("play", () => sendAction("play"));
player.addEventListener("pause", () => sendAction("pause"));
player.addEventListener("seeked", () => sendAction("seek"));
player.addEventListener("error", () => setStatus("Không phát được URL video này", true));

document.querySelector("#change-video-button").addEventListener("click", () => {
  const videoUrl = document.querySelector("#new-video-url").value.trim();
  if (videoUrl) socket.emit("room-action", { action: "load", videoUrl });
});

document.querySelector("#copy-link").addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  document.querySelector("#copy-link").textContent = "Đã sao chép";
});

setInterval(() => {
  calibrateClock();
  if (roomState?.state.playing && !roomState.isHost) {
    const drift = expectedPosition() - player.currentTime;
    if (Math.abs(drift) > 1) player.currentTime = expectedPosition();
    else if (Math.abs(drift) > 0.25) nudgePlayback(drift);
  }
}, 5000);
