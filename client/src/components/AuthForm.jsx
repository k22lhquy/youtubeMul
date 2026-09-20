import { useEffect, useRef, useState } from "react";
import { authConfig, googleLogin, login, register } from "../api";

let googleScript;
const loadGoogle = () => googleScript ||= new Promise((resolve, reject) => {
  if (window.google) return resolve();
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

export function AuthForm({ session, onSession, onLogout }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const googleButton = useRef();
  useEffect(() => {
    let active = true;
    authConfig().then(async ({ googleClientId }) => {
      if (!googleClientId) return;
      await loadGoogle();
      if (!active) return;
      setGoogleEnabled(true);
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: async ({ credential }) => {
        try { onSession(await googleLogin(credential)); } catch (err) { setError(err.message); }
      } });
      window.google.accounts.id.renderButton(googleButton.current, { theme: "filled_black", size: "large", width: 300 });
    }).catch(() => setError("Không tải được đăng nhập Google."));
    return () => { active = false; };
  }, [onSession]);
  if (session) return <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4"><span>Đã đăng nhập: <strong>{session.user.name}</strong></span><button type="button" onClick={onLogout}>Đăng xuất</button></div>;

  const submit = async (event) => {
    event.preventDefault(); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { onSession(await (mode === "register" ? register(data) : login(data))); }
    catch (err) { setError(err.message); }
  };

  return <div className="space-y-3 rounded-xl border border-slate-700 p-4"><form onSubmit={submit} className="space-y-3"><div className="flex gap-2"><button type="button" onClick={() => setMode("login")} disabled={mode === "login"}>Đăng nhập</button><button type="button" onClick={() => setMode("register")} disabled={mode === "register"}>Đăng ký</button></div>{mode === "register" && <label className="block">Tên<input name="name" required minLength="2" maxLength="32" /></label>}<label className="block">Email<input name="email" type="email" required /></label><label className="block">Mật khẩu<input name="password" type="password" required minLength="8" maxLength="128" /></label>{error && <p className="text-red-400">{error}</p>}<button>{mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}</button></form><div ref={googleButton} />{!googleEnabled && <p className="text-sm text-slate-400">Đăng nhập Google cần cấu hình GOOGLE_CLIENT_ID.</p>}</div>;
}
