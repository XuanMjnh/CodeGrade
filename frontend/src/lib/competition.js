export function competitionScope(room,contestId,problemId){
 return room?`room:${room.id}:${room.current.id}:${problemId}`:contestId?`contest:${contestId}:${problemId}`:null;
}
export function shouldClearSubmission(op,{scope,editVersion}){
 return op.type==='SUBMIT'&&Boolean(op.scope)&&op.scope===scope&&op.editVersion===editVersion;
}
