import { useState } from "react";

export function ChatPanel({ messages, onSend }) {
  const [content, setContent] = useState("");
  const submit = (event) => { event.preventDefault(); const value = content.trim(); if (value) { onSend(value); setContent(""); } };
  return <section className="border-t border-slate-700 pt-5"><h2 className="font-bold">Chat</h2><div className="mt-3 max-h-52 space-y-2 overflow-y-auto">{messages.map((message) => <p key={message.id} className="rounded-lg bg-slate-800 p-2 text-sm"><strong>{message.name}:</strong> {message.content}</p>)}</div><form onSubmit={submit} className="mt-3 flex gap-2"><input aria-label="Tin nhắn" maxLength="500" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Nhắn gì đó…" /><button>Gửi</button></form></section>;
}
