import { useEffect, useState } from "react";
import { roomHistory } from "../api";

export function RoomHistory({ session }) {
  const [rooms, setRooms] = useState([]);
  useEffect(() => { if (session) roomHistory(session.token).then(({ rooms }) => setRooms(rooms)).catch(() => setRooms([])); }, [session]);
  if (!session || !rooms.length) return null;
  return <section className="rounded-xl bg-slate-900 p-4"><h2 className="font-bold">Phòng gần đây</h2><div className="mt-3 space-y-2">{rooms.map((room) => <a key={room.code} href={`/#${room.code}`} className="flex justify-between rounded-lg bg-slate-800 p-3 hover:bg-slate-700"><span>{room.code}</span><span className="text-slate-400">{new Date(room.updatedAt).toLocaleString("vi-VN")}</span></a>)}</div></section>;
}
