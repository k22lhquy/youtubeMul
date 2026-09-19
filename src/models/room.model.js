class RoomStore {
  constructor() { this.rooms = new Map(); }
  get(id) { return this.rooms.get(id); }
  set(room) { this.rooms.set(room.id, room); return room; }
  delete(id) { this.rooms.delete(id); }
}

module.exports = new RoomStore();
