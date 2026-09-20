async function request(path, options = {}) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Yêu cầu thất bại.");
  return body;
}

const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const register = (values) => request("/api/auth/register", json(values));
export const login = (values) => request("/api/auth/login", json(values));
export const googleLogin = (credential) => request("/api/auth/google", json({ credential }));
export const authConfig = () => request("/api/auth/config");
export const roomHistory = (token) => request("/api/rooms", { headers: { Authorization: `Bearer ${token}` } });
export async function uploadVideo(token, file) {
  const response = await fetch("/api/videos", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) }, body: file });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Upload video thất bại.");
  return body.url;
}
