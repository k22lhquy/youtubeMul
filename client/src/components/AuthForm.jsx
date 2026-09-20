import { useState } from "react";
import { login, register } from "../api";

export function AuthForm({ session, onSession, onLogout }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  if (session) return <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4"><span>Đã đăng nhập: <strong>{session.user.name}</strong></span><button type="button" onClick={onLogout}>Đăng xuất</button></div>;

  const submit = async (event) => {
    event.preventDefault(); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { onSession(await (mode === "register" ? register(data) : login(data))); }
    catch (err) { setError(err.message); }
  };

  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-700 p-4"><div className="flex gap-2"><button type="button" onClick={() => setMode("login")} disabled={mode === "login"}>Đăng nhập</button><button type="button" onClick={() => setMode("register")} disabled={mode === "register"}>Đăng ký</button></div>{mode === "register" && <label className="block">Tên<input name="name" required minLength="2" maxLength="32" /></label>}<label className="block">Email<input name="email" type="email" required /></label><label className="block">Mật khẩu<input name="password" type="password" required minLength="8" maxLength="128" /></label>{error && <p className="text-red-400">{error}</p>}<button>{mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}</button></form>;
}
