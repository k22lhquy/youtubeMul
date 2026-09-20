async function request(path, options = {}) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Yêu cầu thất bại.");
  return body;
}

const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const guestToken = async (name) => (await request("/api/auth/guest", json({ name }))).token;
export const register = (values) => request("/api/auth/register", json(values));
export const login = (values) => request("/api/auth/login", json(values));
