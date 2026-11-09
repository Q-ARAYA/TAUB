import { cards } from './cards.js';
import { validateCards, hiddenLetter, secretMessage, reconcile, correctOrder, unlock, nextUnlock, openExtra, dailyAvailable, adminSettings, assignPending } from './logic.js';
import { art } from './art.js';
validateCards(cards);
const isAdmin = new URLSearchParams(location.search).get('admin') === '1';
const $ = id => document.getElementById(id), key = 'para-ti-progress-v1';
let saved; try { saved = JSON.parse(localStorage.getItem(key) || 'null') } catch { saved = null }
let state = reconcile(saved, cards), simulated = null, activeDrag = null, ignoreClick = false;
const byId = id => cards.find(c => c.numero === id), now = () => simulated ?? Date.now();
function save() { try { localStorage.setItem(key, JSON.stringify(state)); $('storage-warning').hidden = true } catch { $('storage-warning').hidden = false } }
let revealTimer = null, revealVersion = 0, showingLetters = false, discoveryReady = false;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const themeSymbols = {corazon:['♡','✧'],flor:['❀','✧'],abejas:['✧','◇'],estrellas:['✦','✧'],arco:['➶','✧'],sol:['☀','✧'],atardecer:['☼','≈'],globos:['♡','✧'],mapache:['✧','♡']};
let sparkleTimer = null;
function fillTheme(backdrop, theme) {
    backdrop.dataset.theme = theme; backdrop.replaceChildren();
    // Several actual illustrations make the scene recognizable on a small screen.
    for (let i = 0; i < 10; i++) {
        const motif = document.createElement('span'); motif.className = 'theme-motif motif-' + i;
        if (i % 3 !== 1) motif.innerHTML = art(theme);
        else motif.textContent = (themeSymbols[theme] || themeSymbols.corazon)[i % 2];
        backdrop.append(motif);
    }
}
function setTheme(card) {
    const theme = card?.ilustracion || 'corazon';
    document.body.dataset.theme = theme;
    if ($('theme-backdrop').dataset.theme !== theme) fillTheme($('theme-backdrop'), theme);
    if ($('modal-theme-backdrop').dataset.theme !== theme) fillTheme($('modal-theme-backdrop'), theme);
}
function animateCard(el) {
    el.classList.remove('card-opening'); void el.offsetWidth; el.classList.add('card-opening');
}
function sparkleBurst() {
    const layer = $('card-sparkles'); layer.replaceChildren(); clearTimeout(sparkleTimer);
    if (reducedMotion()) return;
    for (let i = 0; i < 52; i++) {
        const star = document.createElement('span'); star.className = 'opening-sparkle';
        star.textContent = i % 4 === 0 ? '✦' : '✧';
        const angle = Math.random() * Math.PI * 2;
        const radius = 90 + Math.random() * 150;
        star.style.setProperty('--sx', Math.cos(angle) * radius + 'px');
        star.style.setProperty('--sy', Math.sin(angle) * radius + 'px');
        star.style.setProperty('--spark-size', 9 + Math.random() * 16 + 'px');
        star.style.setProperty('--spark-delay', Math.random() * 1.9 + 's');
        star.style.setProperty('--spark-life', 1 + Math.random() * 1.1 + 's');
        star.onanimationend = () => star.remove(); layer.append(star);
    }
    sparkleTimer = setTimeout(() => layer.replaceChildren(), 4500);
}
function openCard(card) {
    if (!card) return;
    cardView($('detail-card'), card);
    if (!$('card-dialog').open) $('card-dialog').showModal();
    // Force layout after entering the top layer so every opening restarts the spin.
    animateCard($('detail-card')); sparkleBurst();
}
const fontMap = { pixel: 'pixel', cursiva: 'cursiva', valiente: 'movie-brave', up: 'movie-up' };
function message(card, tag = 'p') {
    const root = document.createElement(tag); root.className = 'message';
    // Remove braces first while retaining their letter positions. This lets a styled
    // word cross a marked letter, such as {U}p, without losing either treatment.
    const marks = new Set(); let text = '', end = 0;
    for (const match of card.mensaje.matchAll(/\{([^{}]+)\}/gu)) {
        text += card.mensaje.slice(end, match.index); marks.add(text.length);
        text += match[1]; end = match.index + match[0].length;
    }
    text += card.mensaje.slice(end);
    const words = (card.palabrasEstilo || []).filter(w => w.palabra && fontMap[w.fuente]);
    function appendRange(parent, from, to) {
        for (let i = from; i < to;) {
            const char = String.fromCodePoint(text.codePointAt(i));
            if (marks.has(i)) {
                const letter = document.createElement('span'); letter.className = 'hidden-letter';
                letter.textContent = char; parent.append(letter);
            } else parent.append(document.createTextNode(char));
            i += char.length;
        }
    }
    let cursor = 0;
    while (cursor < text.length) {
        let chosen = null, position = text.length;
        for (const word of words) {
            const at = text.indexOf(word.palabra, cursor);
            if (at >= 0 && (at < position || at === position && word.palabra.length > (chosen?.palabra.length || 0))) { chosen = word; position = at }
        }
        if (!chosen) { appendRange(root, cursor, text.length); break }
        appendRange(root, cursor, position);
        const styled = document.createElement('span'); styled.className = fontMap[chosen.fuente];
        appendRange(styled, position, position + chosen.palabra.length); root.append(styled);
        cursor = position + chosen.palabra.length;
    }
    return root;
}
function illustration(card, cls = 'art') {
    const container = document.createElement('div'); container.className = cls; container.innerHTML = art(card.ilustracion);
    if (card.imagen) { const img = document.createElement('img'); img.className = cls; img.alt = 'Ilustración de la tarjeta ' + card.numero; img.loading = 'lazy'; img.decoding = 'async'; img.src = card.imagen; img.onerror = () => img.replaceWith(container); return img } return container;
}
function cardView(el, card, animate = false) {
    el.replaceChildren();
    const face = document.createElement('div'); face.className = 'card-face';
    const num = document.createElement('span'); num.className = 'card-number'; num.textContent = 'N.º ' + String(card.numero).padStart(2, '0');
    const h = document.createElement('span'); h.className = 'card-heart'; h.textContent = '♡'; h.setAttribute('aria-hidden', 'true');
    const bottom = document.createElement('span'); bottom.className = 'card-bottom'; bottom.textContent = 'UN PEDACITO DE MI CORAZÓN';
    face.append(num, h, illustration(card), message(card), bottom);
    const cover = document.createElement('div'); cover.className = 'card-cover'; cover.setAttribute('aria-hidden', 'true');
    const heart = document.createElement('span'); heart.textContent = '♡';
    const label = document.createElement('small'); label.textContent = 'ALGO BONITO PARA TI'; cover.append(heart, label);
    const rotator = document.createElement('div'); rotator.className = 'card-rotator'; rotator.append(face, cover); el.append(rotator); setTheme(card);
    el.classList.remove('card-opening', 'reveal'); if (animate) animateCard(el);
}
const canDiscover = () => dailyAvailable(state, cards, now()) || (state.extraOpening && state.unlocked.length < cards.length);
function configureAdmin(patch) {
    if (!isAdmin) return;
    try {
        const latest = JSON.parse(localStorage.getItem(key) || 'null');
        state = adminSettings(latest, patch, cards);
        save(); render();
    } catch { $('admin-status').textContent = 'No pudimos actualizar la configuración. Intenta de nuevo.' }
}
function renderAdminPreviews() {
    const gallery = $('admin-gallery'); gallery.replaceChildren();
    for (const card of [...cards].sort((a,b) => a.numero-b.numero)) {
        const tile = document.createElement('div'); tile.className = 'tile admin-preview-tile';
        const front = document.createElement('div'); front.className = 'tile-front';
        const button = document.createElement('button'); button.className = 'tile-open';
        const number = document.createElement('small');
        const latest = card.numero === state.lastCard;
        const discovered = state.unlocked.includes(card.numero);
        const assigned = card.numero === state.pendingCard;
        tile.classList.toggle('latest-discovered', latest);
        tile.classList.toggle('assigned-card', assigned);
        number.textContent = 'TARJETA ' + card.numero + (assigned ? ' · ASIGNADA, SIN DESCUBRIR' : latest ? ' · ÚLTIMA DESCUBIERTA ♡' : discovered ? ' · DESCUBIERTA' : ' · PENDIENTE');
        button.append(number, message(card, 'span'));
        button.onclick = () => openCard(card);
        front.append(illustration(card,'thumb'), button); tile.append(front); gallery.append(tile);
    }
}
function render(animate = false) {
    const previousPending = state.pendingCard;
    assignPending(state, cards, now());
    if (previousPending !== state.pendingCard) save();
    if (isAdmin) {
        $('daily').hidden = true; $('collection').hidden = true; $('admin').hidden = false;
        renderAdmin(); renderAdminPreviews();
        if (!$('card-dialog').open) setTheme(null);
        return; // Previews do not save, unlock, reorder, or consume pending opportunities.
    }
    discoveryReady = canDiscover();
    const card = byId(state.lastCard);
    $('discover-card').hidden = !discoveryReady;
    $('today-card').classList.toggle('waiting-discovery', discoveryReady);
    $('today-card').setAttribute('aria-label', discoveryReady ? 'Descubrir mi tarjeta de hoy' : 'Volver a abrir tu tarjeta');
    if (discoveryReady) {
        // Build only a sealed placeholder: no message, letter, image or next-card theme leaks.
        $('today-card').replaceChildren();
        const sealed = document.createElement('div'); sealed.className = 'sealed-daily';
        const heart = document.createElement('span'); heart.textContent = '♡'; heart.setAttribute('aria-hidden', 'true');
        const title = document.createElement('h2'); title.textContent = 'Hay algo bonito para ti';
        const note = document.createElement('p'); note.textContent = 'Tu tarjeta de hoy está esperando. ¿La descubrimos?';
        sealed.append(heart, title, note); $('today-card').append(sealed);
        if (!$('card-dialog').open) setTheme(null);
    } else if (card) cardView($('today-card'), card);
    $('progress').textContent = state.unlocked.length + ' de ' + cards.length + ' tarjetas en tu colección';
    $('day-label').textContent = discoveryReady ? 'Tu sorpresa está lista' : state.unlocked.length === cards.length ? 'Ya tienes todos mis pedacitos de amor' : 'Tu tarjeta de hoy';
    renderGallery(); renderAdmin(); tick(); save();
    if (animate && card) openCard(card);
}
function renderLatestDiscovery() {
    const content = $('admin-latest-content'); content.replaceChildren();
    const card = byId(state.lastCard);
    if (!card) {
        content.textContent = 'Todavía no se ha descubierto ninguna tarjeta en la vista normal.';
        return;
    }
    const title = document.createElement('p'); title.className = 'latest-number'; title.textContent = 'Tarjeta N.º ' + card.numero;
    const date = document.createElement('p'); date.className = 'latest-date';
    date.textContent = state.lastUnlockedAt
        ? 'Descubierta el ' + new Intl.DateTimeFormat('es-CR', {timeZone:'America/Costa_Rica',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(state.lastUnlockedAt)) + ' · Costa Rica'
        : state.lastDay ? 'Día lógico: ' + state.lastDay + ' · La hora no se registraba en la versión anterior.' : 'La fecha de apertura no está registrada.';
    const preview = document.createElement('button'); preview.textContent = 'Ver esta tarjeta'; preview.onclick = () => openCard(card);
    content.append(title, message(card), date, preview);
}
function renderAdmin() {
    renderLatestDiscovery();
    const assigned = byId(state.pendingCard);
    const assignedBox = $('admin-assigned-content'); assignedBox.replaceChildren();
    if (assigned) {
        const label = document.createElement('p'); label.className = 'latest-number'; label.textContent = 'Le tocará la tarjeta N.º ' + assigned.numero;
        const note = document.createElement('p'); note.textContent = 'Ya asignada, todavía sin descubrir. Puedes cambiarla abajo antes de que ella la abra.';
        const preview = document.createElement('button'); preview.textContent = 'Ver la tarjeta asignada'; preview.onclick = () => openCard(assigned);
        assignedBox.append(label, message(assigned), note, preview);
    } else {
        assignedBox.textContent = state.unlocked.length === cards.length ? 'Ya descubrió toda la colección.' : state.nextCard !== null ? 'La tarjeta N.º ' + state.nextCard + ' está elegida para la siguiente apertura; aún debe llegar la hora o habilitar una oportunidad.' : 'Se asignará una tarjeta al llegar las 5:00 a. m. o al habilitar una apertura extra.';
    }
    const pending = cards.filter(c => !state.unlocked.includes(c.numero)).sort((a, b) => a.numero - b.numero);
    const select = $('next-card'); select.replaceChildren();
    const random = document.createElement('option'); random.value = ''; random.textContent = 'Aleatoria (como siempre)'; select.append(random);
    for (const card of pending) { const option = document.createElement('option'); option.value = card.numero; option.textContent = 'N.º ' + card.numero + ' · ' + card.mensaje.replace(/[{}]/g, ''); select.append(option) }
    select.value = state.nextCard === null ? '' : String(state.nextCard);
    select.disabled = !pending.length; $('save-next').disabled = !pending.length;
    $('next-card-status').textContent = !pending.length ? 'Ya están todas desbloqueadas.' : state.nextCard === null ? 'Próxima tarjeta: sorteo aleatorio.' : 'Próxima tarjeta elegida: N.º ' + state.nextCard + '.';
    $('grant-extra').disabled = !pending.length || state.extraOpening;
    $('cancel-extra').disabled = !state.extraOpening;
    $('extra-status').textContent = state.extraOpening ? 'Hay una apertura extra disponible. Ella puede tocar Abrir cuando quiera.' : 'Sin apertura extra: se mantiene el horario habitual.';
}
function tick() {
    const extra = !discoveryReady && state.extraOpening && state.unlocked.length < cards.length;
    $('open-extra').hidden = !extra;
    $('schedule-note').textContent = discoveryReady ? 'Ábrela cuando quieras. El primer paso lo das tú.' : extra ? 'Tu sorpresa ya está lista. Ábrela cuando quieras.' : 'Mañana, otra tarjeta con amor.';
    if (discoveryReady) { $('countdown').textContent = 'Lista para descubrir ♡'; return }
    if (state.unlocked.length === cards.length) { $('countdown').textContent = 'Colección completa ♡'; return }
    const diff = Math.max(0, nextUnlock(now()) - now()); const sec = Math.floor(diff / 1000); $('countdown').textContent = [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map(n => String(n).padStart(2, '0')).join(' : ');
}
function daily() {
    const previous = state.pendingCard;
    assignPending(state, cards, now());
    if (previous !== state.pendingCard) { save(); render(); return }
    if (isAdmin) return;
    const ready = canDiscover();
    if (ready !== discoveryReady) render(); else tick();
}
$('discover-card').onclick = () => {
    if (isAdmin) return;
    // Read the current assignment: an administrator may have changed it in another tab.
    try { state = reconcile(JSON.parse(localStorage.getItem(key) || 'null'), cards) } catch { }
    assignPending(state, cards, now());
    const card = dailyAvailable(state, cards, now()) ? unlock(state, cards, now()) : openExtra(state, cards, now());
    render();
    if (card) { openCard(card); maybeReveal() }
};
function move(id, delta) { const i = state.order.indexOf(id), j = i + delta; if (j < 0 || j >= state.order.length) return;[state.order[i], state.order[j]] = [state.order[j], state.order[i]]; save(); renderGallery(); maybeReveal(); const tile = [...$('gallery').children].find(el => Number(el.dataset.id) === id); tile?.querySelector(delta < 0 ? '.up' : '.down')?.focus() }
function renderGallery() {
    resetSecret();
    $('gallery').replaceChildren(); state.order.forEach((id, index) => {
        const card = byId(id), tile = document.createElement('div'); tile.className = 'tile'; tile.dataset.id = id;
        const handle = document.createElement('button'); handle.className = 'handle'; handle.textContent = '⠿'; handle.setAttribute('aria-label', 'Arrastrar tarjeta ' + id);
        const open = document.createElement('button'); open.className = 'tile-open'; const small = document.createElement('small'); small.textContent = 'TARJETA ' + String(id).padStart(2, '0'); open.append(small, message(card, 'span')); open.onclick = () => { if (ignoreClick) return; openCard(card) };
        const controls = document.createElement('div'); controls.className = 'order-controls'; for (const [delta, label, symbol, cls] of [[-1, 'Subir', '↑', 'up'], [1, 'Bajar', '↓', 'down']]) { const b = document.createElement('button'); b.className = 'arrow ' + cls; b.textContent = symbol; b.setAttribute('aria-label', label + ' tarjeta ' + id); b.disabled = delta < 0 ? index === 0 : index === state.order.length - 1; b.onclick = () => move(id, delta); controls.append(b) }
        handle.onpointerdown = e => { if (e.button !== 0) return; activeDrag = { id, handle }; handle.setPointerCapture(e.pointerId); tile.classList.add('dragging'); ignoreClick = true };
        handle.onpointermove = e => { if (!activeDrag || activeDrag.id !== id) return; e.preventDefault(); if (e.clientY < 80) window.scrollBy(0, -12); if (e.clientY > innerHeight - 100) window.scrollBy(0, 12); const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tile'); if (!target || target === tile) return; const other = Number(target.dataset.id); const from = state.order.indexOf(id), to = state.order.indexOf(other); state.order.splice(from, 1); state.order.splice(to, 0, id); const children = [...$('gallery').children]; state.order.forEach(n => $('gallery').append(children.find(c => Number(c.dataset.id) === n))); handle.setPointerCapture(e.pointerId) };
        const end = () => { if (!activeDrag) return; activeDrag = null; tile.classList.remove('dragging'); save(); renderGallery(); maybeReveal(); setTimeout(() => ignoreClick = false, 100) }; handle.onpointerup = end; handle.onpointercancel = end;
        const front = document.createElement('div'); front.className = 'tile-front'; front.append(handle, illustration(card, 'thumb'), open, controls);
        const back = document.createElement('div'); back.className = 'tile-letter'; back.setAttribute('aria-hidden', 'true'); back.textContent = hiddenLetter(card);
        tile.append(front, back); $('gallery').append(tile);
    });
}
// Reveal only after tapping Discover. Reordering merely indicates readiness.
function resetSecret() {
    revealVersion++; clearTimeout(revealTimer); revealTimer = null; showingLetters = false;
    $('gallery').classList.remove('secret-layout', 'letters-visible');
    $('secret-result').hidden = true; $('restore-cards').hidden = true;
    $('check').disabled = false; $('check').textContent = 'Descubrir el secreto ✧';
    $('confetti').replaceChildren();
}
function reveal() {
    if (!correctOrder(state, cards) || showingLetters) return;
    showingLetters = true; const version = ++revealVersion;
    const stagger = reducedMotion() ? 0 : Math.min(95, 1400 / Math.max(1, cards.length - 1));
    $('check').disabled = true; $('check').textContent = 'Las letras tienen algo que decirte…';
    $('order-feedback').textContent = '';
    const gallery = $('gallery'), tiles = [...gallery.children];
    // Each word stays together on narrow screens; boundaries come from card data.
    let word = document.createElement('div'); word.className = 'secret-word'; gallery.append(word);
    state.order.forEach((id, index) => {
        const tile = tiles.find(t => Number(t.dataset.id) === id);
        tile.style.setProperty('--flip-delay', (index * stagger) + 'ms');
        tile.querySelector('.tile-front').inert = true;
        tile.querySelector('.tile-front').setAttribute('aria-hidden', 'true');
        word.append(tile);
        if (byId(id).separadorDespuesDeLetra && index < state.order.length - 1) {
            word = document.createElement('div'); word.className = 'secret-word'; gallery.append(word);
        }
    });
    gallery.classList.add('secret-layout'); setTheme({ilustracion:'corazon'});
    gallery.scrollIntoView({behavior: reducedMotion() ? 'instant' : 'smooth', block:'center'});
    void gallery.offsetWidth;
    requestAnimationFrame(() => { if (version === revealVersion) gallery.classList.add('letters-visible') });
    const duration = reducedMotion() ? 0 : (cards.length - 1) * stagger + 850;
    revealTimer = setTimeout(() => {
        if (version !== revealVersion) return;
        for (const tile of tiles) tile.querySelector('.tile-letter').removeAttribute('aria-hidden');
        state.revealed = true; save();
        $('secret-text').textContent = secretMessage(cards); $('secret-result').hidden = false;
        $('restore-cards').hidden = false;
        $('check').textContent = 'El secreto era para ti ♡';
        celebrate();
    }, duration);
}
function maybeReveal() {
    if (correctOrder(state, cards) && !$('collection').hidden)
        $('order-feedback').textContent = 'Todas las piezas están en su lugar. Toca Descubrir el secreto ♡';
}
function celebrate() {
    $('confetti').replaceChildren(); if (reducedMotion()) return;
    for (let i = 0; i < 38; i++) {
        const s = document.createElement('span'); s.className = 'particle floating-heart'; s.textContent = i % 4 ? '♡' : '♥';
        s.style.left = Math.random() * 100 + '%'; s.style.setProperty('--duration', 4 + Math.random() * 3 + 's');
        s.style.setProperty('--size', 14 + Math.random() * 20 + 'px'); s.style.setProperty('--drift', (Math.random() - .5) * 160 + 'px');
        s.style.animationDelay = Math.random() * 1.5 + 's'; s.onanimationend = () => s.remove(); $('confetti').append(s);
    }
}
$('collection-button').onclick = () => { $('daily').hidden = true; $('collection').hidden = false; window.scrollTo(0, 0) };
$('back').onclick = () => { if (showingLetters) renderGallery(); setTheme(byId(state.lastCard)); $('daily').hidden = false; $('collection').hidden = true; window.scrollTo(0, 0) };
$('check').onclick = () => { if (correctOrder(state, cards)) { reveal(); return } $('order-feedback').textContent = state.unlocked.length < cards.length ? 'Cada día llega una pieza más. El secreto te espera al reunirlas todas.' : 'Las piezas todavía se están encontrando. Sigue el caminito de los números ♡'; $('gallery').classList.remove('not-yet'); void $('gallery').offsetWidth; $('gallery').classList.add('not-yet') };
for (const d of document.querySelectorAll('dialog')) { d.querySelector('.close').onclick = () => d.close(); d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close() } }) }
$('restore-cards').onclick = () => { renderGallery(); setTheme(byId(state.lastCard)); $('check').focus() };
$('today-card').onclick = () => { if (discoveryReady) { $('discover-card').click(); return } const card = byId(state.lastCard); if (card) openCard(card) };
$('today-card').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('today-card').click() } };
$('card-dialog').addEventListener('close', () => {
    clearTimeout(sparkleTimer); $('card-sparkles').replaceChildren();
    $('detail-card').classList.remove('card-opening'); setTheme(isAdmin ? null : byId(state.lastCard));
});
$('normal-view').href = location.pathname;
$('save-next').onclick = () => {
    const id = $('next-card').value;
    configureAdmin({nextCard: id !== '' ? Number(id) : null});
};
$('grant-extra').onclick = () => configureAdmin({extraOpening:true});
$('cancel-extra').onclick = () => configureAdmin({extraOpening:false});
$('open-extra').onclick = () => { if (isAdmin) return; if (openExtra(state, cards, now())) { render(true); maybeReveal() } };
$('force').onclick = () => {
    configureAdmin({extraOpening:true});
    $('admin-status').textContent = 'Apertura habilitada en la vista normal. Aquí puedes previsualizar las cartas sin descubrirlas.';
};
$('all').onclick = () => $('admin-preview').scrollIntoView({behavior:reducedMotion()?'instant':'smooth'});
$('reset').onclick = () => { if (!isAdmin || !confirm('¿Borrar el progreso de la vista normal de este navegador? Esta acción es independiente de las vistas previas.')) return; state = reconcile(null, cards); save(); render(); $('admin-status').textContent = 'Se reinició el progreso normal por tu solicitud.' };
$('simulate').onclick = () => { const value = $('simulated').value; if (!value) return; const time = Date.parse(value + ':00-06:00'); if (!Number.isFinite(time)) return; simulated = time; $('admin-status').textContent = 'Hora simulada de Costa Rica: ' + value.replace('T', ' '); render(); daily() };
$('real-time').onclick = () => { simulated = null; $('admin-status').textContent = 'Usando la hora real.'; render(); daily() };
window.addEventListener('storage', e => { if (e.key !== key) return; try { state = reconcile(JSON.parse(e.newValue || 'null'), cards); daily(); render() } catch { } });
document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (isAdmin) {
        try { state = reconcile(JSON.parse(localStorage.getItem(key) || 'null'), cards); render() } catch { }
    } else daily();
});
render(); daily(); setInterval(daily, 1000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => { });
