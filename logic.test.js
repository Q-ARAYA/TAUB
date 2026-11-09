import test from 'node:test';import assert from 'node:assert/strict';import {cards} from './cards.js';import {hiddenLetter,secretMessage,logicalDay,nextUnlock,reconcile,unlock,correctOrder,validateCards,openExtra,dailyAvailable,adminSettings,assignPending} from './logic.js';
test('mensaje calculado y separadores exactos',()=>{validateCards(cards);assert.equal(cards.map(hiddenLetter).join(''),'TEAMOUNBUEN');assert.equal(secretMessage(cards),'Te amo un buen');assert.deepEqual(cards.filter(c=>c.separadorDespuesDeLetra).map(c=>c.numero),[2,5,7]);assert.equal(hiddenLetter({mensaje:'Minecraft Mérida Carl Ellie {U}p'}),'U')});
test('cambio de día a las 5 AM en Costa Rica',()=>{assert.equal(logicalDay(Date.parse('2026-11-09T04:59:59-06:00')),'2026-11-08');assert.equal(logicalDay(Date.parse('2026-11-09T05:00:00-06:00')),'2026-11-09');assert.equal(logicalDay(Date.parse('2026-11-09T00:00:00-06:00')),'2026-11-08');assert.equal(nextUnlock(Date.parse('2026-11-09T04:59:59-06:00')),Date.parse('2026-11-09T05:00:00-06:00'))});
test('un desbloqueo por día sin repeticiones ni retrocesos de fecha',()=>{const s=reconcile(null,cards),t=Date.parse('2026-11-09T05:00:00-06:00');assert.ok(unlock(s,cards,t));assert.equal(unlock(s,cards,t+1000),null);assert.equal(unlock(s,cards,t-86400000),null);assert.ok(unlock(s,cards,t+86400000));while(unlock(s,cards,t,true)){}assert.equal(new Set(s.unlocked).size,cards.length);assert.equal(unlock(s,cards,t,true),null)});
test('agregar tarjetas conserva progreso e invalida revelado anterior',()=>{let s=reconcile(null,cards);while(unlock(s,cards,Date.now(),true)){}s.revealed=true;const expanded=[...cards,{numero:12,mensaje:'{X} extra'}];const r=reconcile(s,expanded);assert.equal(r.unlocked.length,11);assert.equal(r.revealed,false);assert.equal(unlock(r,expanded,Date.now(),true).numero,12);assert.equal(correctOrder(r,expanded),false);r.order.sort((a,b)=>a-b);assert.equal(correctOrder(r,expanded),true)});
test('orden compara números de tarjetas y limpia almacenamiento inválido',()=>{const s=reconcile({unlocked:[1,1,99],order:[99,1]},cards);assert.deepEqual(s.unlocked,[1]);assert.deepEqual(s.order,[1]);assert.equal(correctOrder(s,cards),false);assert.throws(()=>validateCards([...cards,cards[0]]));assert.throws(()=>hiddenLetter({mensaje:'Sin letra'}))});

const morning=Date.parse('2026-11-09T05:00:00-06:00');
test('elegir próxima tarjeta respeta la espera y se consume una sola vez',()=>{
 const s=reconcile(null,cards);unlock(s,cards,morning,false,()=>0);s.nextCard=8;
 assert.equal(unlock(s,cards,morning+1000),null);assert.equal(s.nextCard,8);
 const restored=reconcile(JSON.parse(JSON.stringify(s)),cards);assert.equal(restored.nextCard,8);
 assert.equal(unlock(restored,cards,morning+86400000,false,()=>0).numero,8);
 assert.equal(restored.nextCard,null);assert.equal(unlock(restored,cards,morning+2*86400000,false,()=>0).numero,2);
});
test('oportunidad extra espera el toque, persiste y solo permite una apertura',()=>{
 const s=reconcile(null,cards);unlock(s,cards,morning,false,()=>0);s.nextCard=11;s.extraOpening=true;
 assert.equal(unlock(s,cards,morning+1000),null);assert.equal(s.unlocked.length,1);
 const restored=reconcile(JSON.parse(JSON.stringify(s)),cards);assert.equal(restored.extraOpening,true);
 assert.equal(openExtra(restored,cards,morning+1000).numero,11);assert.equal(restored.extraOpening,false);assert.equal(restored.nextCard,null);
 assert.equal(openExtra(restored,cards,morning+2000),null);assert.equal(unlock(restored,cards,morning+2000),null);
 assert.ok(unlock(restored,cards,morning+86400000));
});
test('sin permiso no hay apertura extra y cancelarla conserva la elección',()=>{
 const s=reconcile(null,cards);unlock(s,cards,morning);s.nextCard=cards.find(c=>!s.unlocked.includes(c.numero)).numero;
 assert.equal(openExtra(s,cards,morning+1000),null);s.extraOpening=true;s.extraOpening=false;
 assert.equal(openExtra(s,cards,morning+1000),null);assert.notEqual(s.nextCard,null);
 assert.equal(unlock(s,cards,morning+1000),null);
});
test('las 5 AM consumen la oportunidad pendiente sin conceder una segunda apertura',()=>{
 const s=reconcile(null,cards);unlock(s,cards,morning,false,()=>0);s.extraOpening=true;s.nextCard=5;
 assert.equal(unlock(s,cards,morning+86400000).numero,5);assert.equal(s.extraOpening,false);
 assert.equal(openExtra(s,cards,morning+86400000+1000),null);
});
test('una apertura extra aleatoria no repite tarjetas y respeta medianoche',()=>{
 const s=reconcile(null,cards);unlock(s,cards,morning,false,()=>0);s.extraOpening=true;
 const midnight=Date.parse('2026-11-10T00:00:00-06:00');const card=openExtra(s,cards,midnight);
 assert.notEqual(card.numero,1);assert.equal(unlock(s,cards,midnight+1000),null);
 assert.ok(unlock(s,cards,Date.parse('2026-11-10T05:00:00-06:00')));
});
test('reconciliar elimina elecciones inválidas y permisos al completar la colección',()=>{
 assert.equal(reconcile({unlocked:[1],nextCard:1},cards).nextCard,null);
 assert.equal(reconcile({nextCard:999},cards).nextCard,null);
 assert.equal(reconcile({nextCard:'2',extraOpening:'true'},cards).extraOpening,false);
 const full=reconcile({unlocked:cards.map(c=>c.numero),nextCard:2,extraOpening:true},cards);
 assert.equal(full.nextCard,null);assert.equal(full.extraOpening,false);assert.equal(openExtra(full,cards,morning),null);
});

test('la disponibilidad no descubre ni consume la tarjeta elegida al consultar o recargar',()=>{
 const s=reconcile(null,cards);s.nextCard=8;
 const before=JSON.stringify(s);
 assert.equal(dailyAvailable(s,cards,morning),true);
 assert.equal(dailyAvailable(s,cards,morning+1000),true);
 assert.equal(JSON.stringify(s),before);
 const restored=reconcile(JSON.parse(before),cards);
 assert.equal(dailyAvailable(restored,cards,morning),true);
 assert.equal(restored.unlocked.length,0);assert.equal(restored.nextCard,8);
 assert.equal(unlock(restored,cards,morning).numero,8);
 assert.equal(dailyAvailable(restored,cards,morning+1000),false);
});
test('a las 5 AM queda disponible sin agregar nada a la colección hasta el toque',()=>{
 const s=reconcile(null,cards);unlock(s,cards,morning);
 assert.equal(dailyAvailable(s,cards,Date.parse('2026-11-10T04:59:59-06:00')),false);
 assert.equal(dailyAvailable(s,cards,morning+86400000),true);
 assert.equal(s.unlocked.length,1);
 while(unlock(s,cards,morning,true)){}
 assert.equal(dailyAvailable(s,cards,morning+86400000),false);
});

test('administrar oportunidades conserva toda la colección y no consume la próxima tarjeta',()=>{
 const normal=reconcile(null,cards);unlock(normal,cards,morning,false,()=>0);normal.nextCard=8;
 const snapshot=JSON.stringify(normal);
 const configured=adminSettings(normal,{extraOpening:true,unlocked:[1,2,3],lastDay:'2099-01-01',revealed:true},cards);
 for(const field of ['unlocked','order','lastDay','lastCard','revealed','fingerprint'])assert.deepEqual(configured[field],normal[field]);
 assert.equal(JSON.stringify(normal),snapshot);assert.equal(configured.nextCard,8);assert.equal(configured.extraOpening,true);
 const reloaded=reconcile(JSON.parse(JSON.stringify(configured)),cards);
 assert.equal(reloaded.unlocked.length,1);
 assert.equal(openExtra(reloaded,cards,morning+1000).numero,8);
 assert.equal(reloaded.unlocked.length,2);assert.equal(reloaded.extraOpening,false);
});
test('configurar desde administración conserva descubrimientos recientes y descarta elecciones ya abiertas',()=>{
 const latest=reconcile(null,cards);unlock(latest,cards,morning,false,()=>0);unlock(latest,cards,morning+86400000,false,()=>0);
 const result=adminSettings(JSON.parse(JSON.stringify(latest)),{nextCard:2,extraOpening:true},cards);
 assert.deepEqual(result.unlocked,[1,2]);assert.equal(result.lastDay,latest.lastDay);assert.equal(result.nextCard,null);
 assert.deepEqual(result.order,latest.order);
});

test('la última apertura registra su hora y administrar o recargar no la altera',()=>{
 const normal=reconcile(null,cards);unlock(normal,cards,morning,false,()=>0);
 assert.equal(normal.lastUnlockedAt,new Date(morning).toISOString());
 const configured=adminSettings(normal,{nextCard:8,extraOpening:true,lastUnlockedAt:'2099-01-01T00:00:00Z'},cards);
 assert.equal(configured.lastUnlockedAt,normal.lastUnlockedAt);
 const restored=reconcile(JSON.parse(JSON.stringify(configured)),cards);
 assert.equal(restored.lastUnlockedAt,normal.lastUnlockedAt);
 const before=restored.lastUnlockedAt;assert.equal(unlock(restored,cards,morning+1000),null);assert.equal(restored.lastUnlockedAt,before);
 const openedAt=morning+3600000;
 assert.equal(openExtra(restored,cards,openedAt).numero,8);
 assert.equal(restored.lastUnlockedAt,new Date(openedAt).toISOString());assert.equal(restored.lastCard,8);
});
test('el progreso antiguo no inventa horas y limpia fechas inválidas',()=>{
 assert.equal(reconcile({unlocked:[1],lastCard:1,lastDay:'2026-11-09'},cards).lastUnlockedAt,null);
 assert.equal(reconcile({unlocked:[1],lastCard:1,lastUnlockedAt:'incorrecta'},cards).lastUnlockedAt,null);
 assert.equal(reconcile({unlocked:[1],lastCard:999,lastUnlockedAt:'2026-11-09T11:00:00Z'},cards).lastUnlockedAt,null);
});

test('asignar a las 5 AM no descubre y conserva el sorteo al recargar',()=>{
 const s=reconcile(null,cards);unlock(s,cards,morning,false,()=>0);
 assert.equal(assignPending(s,cards,morning+1000,()=>0),null);
 const card=assignPending(s,cards,morning+86400000,()=>0);assert.equal(card.numero,2);
 assert.deepEqual(s.unlocked,[1]);assert.equal(s.lastCard,1);assert.equal(s.lastDay,'2026-11-09');
 const restored=reconcile(JSON.parse(JSON.stringify(s)),cards);
 assert.equal(assignPending(restored,cards,morning+86400000,()=>.99).numero,2);
 assert.equal(unlock(restored,cards,morning+86400000,false,()=>.99).numero,2);assert.equal(restored.pendingCard,null);
});
test('habilitar extra asigna antes del toque y permite reemplazar por elección administrativa',()=>{
 const initial=reconcile(null,cards);unlock(initial,cards,morning,false,()=>0);
 let configured=adminSettings(initial,{extraOpening:true},cards);
 assert.equal(assignPending(configured,cards,morning+1000,()=>0).numero,2);
 const originalDay=configured.lastDay;
 configured=adminSettings(configured,{nextCard:8},cards);
 assert.equal(assignPending(configured,cards,morning+1000).numero,8);
 assert.deepEqual(configured.unlocked,[1]);assert.equal(configured.lastDay,originalDay);
 assert.equal(openExtra(configured,cards,morning+2000).numero,8);
 assert.equal(configured.pendingCard,null);assert.equal(configured.extraOpening,false);
});
test('elección anticipada no permite descubrir antes del horario y se asigna al llegar',()=>{
 const initial=reconcile(null,cards);unlock(initial,cards,morning,false,()=>0);
 const selected=adminSettings(initial,{nextCard:9},cards);
 assert.equal(assignPending(selected,cards,morning+1000),null);assert.equal(selected.nextCard,9);
 assert.equal(unlock(selected,cards,morning+1000),null);
 assert.equal(assignPending(selected,cards,morning+86400000).numero,9);
 assert.equal(selected.unlocked.length,1);
});
test('cancelar extra elimina asignación anticipada sin perder elección y nunca asigna cartas descubiertas',()=>{
 const initial=reconcile(null,cards);unlock(initial,cards,morning,false,()=>0);
 let selected=adminSettings(initial,{nextCard:9,extraOpening:true},cards);assignPending(selected,cards,morning+1000);
 selected=adminSettings(selected,{extraOpening:false},cards);
 assert.equal(assignPending(selected,cards,morning+1000),null);assert.equal(selected.pendingCard,null);assert.equal(selected.nextCard,9);
 assert.equal(reconcile({unlocked:[1],pendingCard:1},cards).pendingCard,null);
 const full=reconcile({unlocked:cards.map(c=>c.numero),pendingCard:8},cards);assert.equal(assignPending(full,cards,morning),null);
});
