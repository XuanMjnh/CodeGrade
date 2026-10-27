export function formatCountdown(deadline,now,withHours=false){
 const seconds=Math.max(0,Math.ceil((deadline-now)/1000));
 const pad=n=>String(n).padStart(2,'0');
 return withHours?`${pad(Math.floor(seconds/3600))}:${pad(Math.floor(seconds/60)%60)}:${pad(seconds%60)}`:`${pad(Math.floor(seconds/60))}:${pad(seconds%60)}`;
}
