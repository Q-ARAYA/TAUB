export function hiddenLetter(card) {
 const matches = [...card.mensaje.matchAll(/\{([^{}]+)\}/gu)];
 if (matches.length !== 1 || [...matches[0][1]].length !== 1) throw new Error('Cada tarjeta necesita una letra entre llaves: '+card.numero);
 return matches[0][1];
}
export function validateCards(cards) {
 const ids = cards.map(c=>c.numero);
 if (!cards.length || new Set(ids).size !== ids.length || ids.some(n=>!Number.isInteger(n)||n<1)) throw new Error('Usa números positivos únicos en las tarjetas.');
 cards.forEach(hiddenLetter);
}
export function secretMessage(cards) {
 const text = [...cards].sort((a,b)=>a.numero-b.numero).map(c=>hiddenLetter(c)+(c.separadorDespuesDeLetra?' ':'')).join('').trim().toLocaleLowerCase('es');
 return text.charAt(0).toLocaleUpperCase('es')+text.slice(1);
}
// Costa Rica tiene UTC−6 todo el año. Las 05:00 locales equivalen a las 11:00 UTC.
export function logicalDay(now=Date.now()) { return new Date(Number(now)-11*3600000).toISOString().slice(0,10); }
export function nextUnlock(now=Date.now()) { const d=new Date(Number(now)); const t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),11); return t>Number(now)?t:t+86400000; }
export function reconcile(saved,cards) {
 const valid=new Set(cards.map(c=>c.numero));
 const clean=a=>[...new Set(Array.isArray(a)?a:[])].filter(n=>valid.has(n));
 const unlocked=clean(saved?.unlocked);
 const order=clean(saved?.order).filter(n=>unlocked.includes(n));
 unlocked.forEach(n=>{if(!order.includes(n))order.push(n)});
 const fingerprint=[...cards].sort((a,b)=>a.numero-b.numero).map(c=>c.numero+':'+hiddenLetter(c)+':'+!!c.separadorDespuesDeLetra).join('|');
 const nextCard=valid.has(saved?.nextCard)&&!unlocked.includes(saved.nextCard)?saved.nextCard:null;
 const extraOpening=unlocked.length<cards.length&&saved?.extraOpening===true;
 const lastUnlockedAt=unlocked.includes(saved?.lastCard)&&typeof saved?.lastUnlockedAt==='string'&&Number.isFinite(Date.parse(saved.lastUnlockedAt))?new Date(saved.lastUnlockedAt).toISOString():null;
 const pendingCard=valid.has(saved?.pendingCard)&&!unlocked.includes(saved.pendingCard)?saved.pendingCard:null;
 return {pendingCard,lastUnlockedAt,nextCard,extraOpening,unlocked,order,lastDay:typeof saved?.lastDay==='string'?saved.lastDay:null,lastCard:unlocked.includes(saved?.lastCard)?saved.lastCard:unlocked.at(-1),revealed:!!saved?.revealed&&saved?.fingerprint===fingerprint&&unlocked.length===cards.length,fingerprint};
}
// Admin writes may change scheduling only, never collection progress.
// Always apply to the latest saved value so an older admin tab cannot undo a discovery.
export function adminSettings(saved,patch,cards) {
 const result=reconcile(saved,cards);
 if(Object.hasOwn(patch,'nextCard')) {
  result.nextCard=cards.some(c=>c.numero===patch.nextCard&&!result.unlocked.includes(c.numero))?patch.nextCard:null;
  result.pendingCard=null; // A new explicit choice (or returning to random) replaces the unopened assignment.
 }
 if(Object.hasOwn(patch,'extraOpening')) result.extraOpening=patch.extraOpening===true&&result.unlocked.length<cards.length;
 return result;
}
export function correctOrder(state,cards) {
 const sorted=[...cards].sort((a,b)=>a.numero-b.numero);
 return state.unlocked.length===cards.length && state.order.length===cards.length && sorted.every((c,i)=>c.numero===state.order[i]);
}
// Availability is not collection progress: a daily card is added only after a tap.
export function dailyAvailable(state,cards,now=Date.now()) {
 return cards.some(c=>!state.unlocked.includes(c.numero)) && (!state.lastDay || logicalDay(now)>state.lastDay);
}
// Assign at availability, separately from discovery. Repeated visits never reroll it.
export function assignPending(state,cards,now=Date.now(),random=Math.random) {
 const remaining=cards.filter(c=>!state.unlocked.includes(c.numero));
 if(!remaining.length||(!dailyAvailable(state,cards,now)&&!state.extraOpening)) {state.pendingCard=null;return null}
 const card=remaining.find(c=>c.numero===state.nextCard)
  ??remaining.find(c=>c.numero===state.pendingCard)
  ??remaining[Math.floor(random()*remaining.length)];
 state.pendingCard=card.numero;
 return card;
}
export function unlock(state,cards,now=Date.now(),force=false,random=Math.random) {
 const day=logicalDay(now);
 if(!force && !dailyAvailable(state,cards,now)) return null;
 const remaining=cards.filter(c=>!state.unlocked.includes(c.numero));
 if(!remaining.length)return null;
 // La elección del administrador solo reemplaza el sorteo; no altera el horario.
 const card=remaining.find(c=>c.numero===state.nextCard)??remaining.find(c=>c.numero===state.pendingCard)??remaining[Math.floor(random()*remaining.length)];
 state.nextCard=null; state.pendingCard=null; state.extraOpening=false;
 state.unlocked.push(card.numero); state.order.push(card.numero); state.lastDay=day; state.lastCard=card.numero; state.lastUnlockedAt=new Date(Number(now)).toISOString();
 return card;
}

// Una oportunidad extra se consume al abrirla o al llegar el desbloqueo normal.
export function openExtra(state,cards,now=Date.now()) {
 if(!state.extraOpening)return null;
 return unlock(state,cards,now,true);
}
