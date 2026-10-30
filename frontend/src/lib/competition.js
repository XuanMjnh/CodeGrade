export function competitionScope(room, contestId, problemId) {
  return room
    ? `room:${room.id}:${room.current.id}:${problemId}`
    : contestId
      ? `contest:${contestId}:${problemId}`
      : null;
}
