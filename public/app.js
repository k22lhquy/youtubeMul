const form = document.querySelector("#room-form");
const lobby = document.querySelector("#lobby");
const watchRoom = document.querySelector("#watch-room");
const player = document.querySelector("#player");
const roomCode = document.querySelector("#room-code");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const videoUrl = document.querySelector("#video-url").value.trim();
  const roomId = crypto.randomUUID().slice(0, 6).toUpperCase();
  roomCode.textContent = `PHÒNG ${roomId}`;
  player.src = videoUrl;
  lobby.classList.add("hidden");
  watchRoom.classList.remove("hidden");
  history.replaceState({}, "", `/#${roomId}`);
});

document.querySelector("#copy-link").addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  document.querySelector("#copy-link").textContent = "Đã sao chép";
});
