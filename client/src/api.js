export async function guestToken(name) {
  const response = await fetch("/api/auth/guest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Không tạo được phiên đăng nhập.");
  return body.token;
}
