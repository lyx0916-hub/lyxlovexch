/* ============================================================
   script.js — 李雅璇 ❤️ 许晨皓 情侣网站
   功能：登录、计时器、相册、悄悄话、纪念日、记仇本、心愿清单
   云端同步版 — 所有设备数据完全一致
   ============================================================ */

/* ==============================================================
   【自定义区】 —— 只需修改这里
   ============================================================== */

// 【自定义】两位用户名（必须与 HTML select 选项一致）
const VALID_NAMES = ['许晨皓', '李雅璇'];

// 【自定义】登录密码（两人共用同一密码）
const LOGIN_PASSWORD = 'lyxxch99';

// 【自定义】恋爱开始日期（默认值，可在页面上修改）
const DEFAULT_LOVE_START = '2022-02-14';

// 【自定义】记仇本月度上限
const GRUDGE_LIMIT = 50;

// 【自定义】初始纪念日列表
const DEFAULT_ANNIVERSARIES = [
  { date: '2026-04-23', event: '💕 第一次见面~' },
];

/* ==============================================================
   🔥 云端存储核心（不改动任何功能，只替换存储逻辑）
   ============================================================== */
async function getCloud(key, fallback = null) {
  try {
    let res = await fetch(`/api/get?key=${key}`);
    let data = await res.json();
    return data.value !== null ? JSON.parse(data.value) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function setCloud(key, val) {
  try {
    await fetch("/api/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: JSON.stringify(val) })
    });
  } catch (e) {}
}

// 🔥 原来的 localStorage 逻辑全部替换成云端，不影响任何功能
async function lsGet(key, fallback = null) {
  return await getCloud(key, fallback);
}
async function lsSet(key, val) {
  await setCloud(key, val);
}

/* ==============================================================
   工具函数
   ============================================================== */
function $(id) { return document.getElementById(id); }
function pad(n) { return String(n).padStart(2, '0'); }

// Toast 提示
let toastTimer;
function showToast(msg, duration = 2200) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// HTML 转义
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// 格式化时间
function fmtTime(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 格式化纪念日日期
function fmtDate(dateStr) {
  const [y,m,d] = dateStr.split('-');
  return `${y}.${m}.${d}`;
}

// 抖动动画
function shake(el) {
  const frames = ['-5px','5px','-3px','3px','0'];
  let i = 0;
  const iv = setInterval(() => {
    el.style.transform = `translateX(${frames[i]})`;
    if (++i >= frames.length) { clearInterval(iv); el.style.transform = ''; }
  }, 55);
}

/* ==============================================================
   花瓣飘落（登录页）
   ============================================================== */
(function spawnPetals() {
  const container = $('petals');
  if (!container) return;
  const symbols = ['🌸','🌹','💮','🌷','❤️','💕'];
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const left = Math.random() * 100;
    const dur  = Math.random() * 10 + 8;
    const delay = Math.random() * 12;
    const size = Math.random() * 0.8 + 0.7;
    p.style.cssText = `left:${left}%;animation-duration:${dur}s;animation-delay:-${delay}s;font-size:${size}rem`;
    container.appendChild(p);
  }
})();

/* ==============================================================
   登录逻辑
   ============================================================== */
function togglePw() {
  const inp = $('loginPwd');
  const btn = $('eyeBtn');
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

async function doLogin() {
  const name = $('loginName').value.trim();
  const pwd  = $('loginPwd').value.trim();
  const err  = $('loginError');

  if (!VALID_NAMES.includes(name)) {
    err.textContent = '请选择你的名字 😊';
    shake($('loginName'));
    return;
  }
  if (pwd !== LOGIN_PASSWORD) {
    err.textContent = '密码不对哦，再想想 🔐';
    shake($('loginPwd'));
    $('loginPwd').value = '';
    return;
  }

  await lsSet('couple_user', name);
  err.textContent = '';

  $('loginPage').style.opacity = '0';
  $('loginPage').style.transition = 'opacity 0.6s';
  setTimeout(() => {
    $('loginPage').style.display = 'none';
    $('mainApp').classList.remove('hidden');
    onAppInit(name);
  }, 600);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && $('loginPage') && $('loginPage').style.display !== 'none') doLogin();
});

async function doLogout() {
  await lsSet('couple_user', null);
  $('mainApp').classList.add('hidden');
  $('loginPage').style.opacity = '1';
  $('loginPage').style.display = 'flex';
  $('loginName').value = '';
  $('loginPwd').value = '';
}

window.addEventListener('load', async () => {
  const saved = await lsGet('couple_user');
  if (saved && VALID_NAMES.includes(saved)) {
    $('loginPage').style.display = 'none';
    $('mainApp').classList.remove('hidden');
    onAppInit(saved);
  }
});

/* ==============================================================
   App 初始化（登录后调用）
   ============================================================== */
async function onAppInit(userName) {
  const av = $('composeAvatar');
  if (av) av.textContent = userName.charAt(0);

  const now = new Date();
  const dateEl = $('heroCurDate');
  if (dateEl) dateEl.textContent = `${now.getFullYear()}年 ${now.getMonth()+1}月 ${now.getDate()}日`;

  await initTimer();
  initAlbum();
  await initWhisper();
  await initAnniversary();
  await initGrudge();
  await initWishlist();
  initScrollAnim();
}

/* ==============================================================
   导航控制
   ============================================================== */
function toggleNav() {
  const nav = $('mobileNav');
  nav.classList.toggle('hidden');
}
function closeNav() {
  $('mobileNav').classList.add('hidden');
}

/* ==============================================================
   首页：恋爱计时器
   ============================================================== */
let timerInterval;

async function initTimer() {
  const saved = await lsGet('love_start_date') || DEFAULT_LOVE_START;
  const inp = $('startDateInput');
  if (inp) inp.value = saved;

  updateStartDateDisplay(saved);
  clearInterval(timerInterval);
  timerInterval = setInterval(() => tickTimer(saved), 1000);
  tickTimer(saved);
}

async function saveStartDate() {
  const inp = $('startDateInput');
  const val = inp ? inp.value : '';
  if (!val) { showToast('请选择日期 📅'); return; }
  await lsSet('love_start_date', val);
  clearInterval(timerInterval);
  updateStartDateDisplay(val);
  timerInterval = setInterval(() => tickTimer(val), 1000);
  tickTimer(val);
  showToast('日期已更新 💕');
}

function updateStartDateDisplay(dateStr) {
  const el = $('heroStartDate');
  if (el) el.textContent = `从 ${dateStr.replace(/-/g,'年 ').replace(/-/,'月 ')}日 起`;
}

function tickTimer(dateStr) {
  const start = new Date(dateStr);
  const now   = new Date();
  const diff  = now - start;
  if (diff < 0) {
    ['t-years','t-days','t-hours','t-minutes','t-seconds'].forEach(id => {
      const el = $(id); if (el) el.textContent = '0';
    });
    return;
  }
  let years = now.getFullYear() - start.getFullYear();
  let anniv = new Date(start); anniv.setFullYear(now.getFullYear());
  if (anniv > now) { years--; anniv.setFullYear(now.getFullYear() - 1); }

  const days    = Math.floor((now - anniv) / 86400000);
  const hours   = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000)   % 60;
  const seconds = Math.floor(diff / 1000)    % 60;

  const set = (id, v) => { const el=$(id); if (el && el.textContent !== String(v)) el.textContent = v; };
  set('t-years',   years);
  set('t-days',    days);
  set('t-hours',   hours);
  set('t-minutes', minutes);
  set('t-seconds', seconds);
}

/* ==============================================================
   板块1：情侣相册
   ============================================================== */
let albumPhotos = [];

async function initAlbum() {
  const saved = await lsGet('couple_album');
  if (saved && Array.isArray(saved)) {
    albumPhotos = saved;
  } else {
    albumPhotos = [
      { id: Date.now() + 1, src: 'https://picsum.photos/seed/lyxxch1/600/400', name: '我们的合照' },
      { id: Date.now() + 2, src: 'https://picsum.photos/seed/lyxxch2/600/400', name: '那个夏天' },
      { id: Date.now() + 3, src: 'https://picsum.photos/seed/lyxxch3/600/400', name: '一起的风景' },
    ];
  }
  renderAlbum();
}

function renderAlbum() {
  const grid = $('albumGrid');
  if (!grid) return;
  if (albumPhotos.length === 0) {
    grid.innerHTML = '<div class="album-empty">还没有照片，快上传第一张吧 📷</div>';
    return;
  }
  grid.innerHTML = albumPhotos.map(p => `
    <div class="album-cell" data-id="${p.id}">
      <img src="${esc(p.src)}" alt="${esc(p.name)}" loading="lazy" onclick="previewImg('${esc(p.src)}')" />
      <div class="album-cell-overlay">
        <span style="color:#fff;font-size:0.85rem;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.4)">${esc(p.name)}</span>
        <button class="album-del-btn" onclick="deletePhoto(${p.id}, event)">🗑 删除</button>
      </div>
    </div>
  `).join('');
}

// 替换你原来的 handlePhotoUpload
function handlePhotoUpload(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  let loaded = 0;

  files.forEach(file => {
    compressImage(file, 600, 0.7).then(compressedDataUrl => {
      albumPhotos.push({
        id: Date.now() + Math.random(),
        src: compressedDataUrl,
        name: file.name.replace(/\.[^.]+$/, '')
      });
      loaded++;
      if (loaded === files.length) {
        renderAlbum();
        showToast(`已添加 ${files.length} 张照片（已压缩）📷`);
      }
    });
  });
  e.target.value = '';
}

// 图片压缩工具函数（关键！）
function compressImage(file, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = URL.createObjectURL(file);
  });
}

async function deletePhoto(id, e) {
  e.stopPropagation();
  albumPhotos = albumPhotos.filter(p => p.id !== id);
  await saveAlbum();
  renderAlbum();
  showToast('照片已删除');
}

async function saveAlbum() {
  const toSave = albumPhotos.map(p => ({
    id: p.id,
    src: p.src,
    name: p.name
  }));
  await lsSet('couple_album', toSave);
  showToast('相册已保存 💾');
}

function previewImg(src) {
  const ov = $('imgPreview');
  const img = $('imgPreviewImg');
  if (!ov || !img) return;
  img.src = src;
  ov.classList.remove('hidden');
}
function closeImgPreview() {
  $('imgPreview').classList.add('hidden');
  $('imgPreviewImg').src = '';
}

/* ==============================================================
   板块2：悄悄话
   ============================================================== */
let whispers = [];
let replyTargetId = null;

async function initWhisper() {
  whispers = await lsGet('couple_whispers') || [];
  renderWhispers();
}

function getCurrentUser() { return lsGet('couple_user') || '我'; }

async function sendWhisper() {
  const ta = $('whisperText');
  const text = ta ? ta.value.trim() : '';
  if (!text) { showToast('写点什么再发吧 💌'); shake(ta); return; }
  const author = await getCurrentUser();
  whispers.unshift({ id: Date.now(), author, text, time: Date.now(), replies: [] });
  await lsSet('couple_whispers', whispers);
  ta.value = '';
  renderWhispers();
  showToast('纸条已发出 💌');
}

function renderWhispers() {
  const list = $('whisperList');
  if (!list) return;
  const me = getCurrentUser();
  if (whispers.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#a07878;font-style:italic;padding:30px 0">还没有悄悄话，快写下第一张纸条吧 💌</p>';
    return;
  }
  list.innerHTML = whispers.map(w => {
    const isMe = w.author === me;
    const repliesHtml = (w.replies || []).map(r => `
      <div class="reply-bubble">
        <div class="reply-meta">${esc(r.author)} · ${fmtTime(r.time)}</div>
        <div>${esc(r.text)}</div>
      </div>
    `).join('');
    return `
      <div class="whisper-note ${isMe ? 'right' : ''}">
        <div class="note-avatar ${isMe ? '' : 'alt'}">${esc(w.author.charAt(0))}</div>
        <div class="note-body">
          <div class="note-meta">
            <span class="note-name">${esc(w.author)}</span>
            <span>${fmtTime(w.time)}</span>
          </div>
          <div class="note-card">${esc(w.text)}</div>
          <div class="note-actions">
            <button class="note-reply-btn" onclick="openReplyModal(${w.id})">💬 回复</button>
            ${isMe ? `<button class="note-del-btn" onclick="deleteWhisper(${w.id})">🗑 删除</button>` : ''}
          </div>
          ${repliesHtml ? `<div class="note-replies">${repliesHtml}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function deleteWhisper(id) {
  whispers = whispers.filter(w => w.id !== id);
  await lsSet('couple_whispers', whispers);
  renderWhispers();
  showToast('纸条已删除');
}

function openReplyModal(id) {
  replyTargetId = id;
  const w = whispers.find(x => x.id === id);
  if (!w) return;
  $('replyOriginal').textContent = `"${w.text}"`;
  $('replyText').value = '';
  $('replyModal').classList.remove('hidden');
}
function closeReplyModal() { $('replyModal').classList.add('hidden'); replyTargetId = null; }

async function sendReply() {
  const text = $('replyText').value.trim();
  if (!text) { showToast('写点什么吧'); shake($('replyText')); return; }
  const w = whispers.find(x => x.id === replyTargetId);
  if (!w) return;
  if (!w.replies) w.replies = [];
  w.replies.push({ author: await getCurrentUser(), text, time: Date.now() });
  await lsSet('couple_whispers', whispers);
  closeReplyModal();
  renderWhispers();
  showToast('回复已发送 💬');
}

/* ==============================================================
   板块3：纪念日
   ============================================================== */
let anniversaries = [];

async function initAnniversary() {
  const saved = await lsGet('couple_anniversaries');
  anniversaries = (saved && Array.isArray(saved)) ? saved : [...DEFAULT_ANNIVERSARIES];
  renderAnniversaries();
}

function renderAnniversaries() {
  const list = $('anniList');
  if (!list) return;
  if (anniversaries.length === 0) {
    list.innerHTML = '<li style="color:#a07878;font-style:italic;padding:16px 0">还没有纪念日，快添加第一个吧 🗓</li>';
    return;
  }
  const sorted = [...anniversaries].sort((a,b) => a.date.localeCompare(b.date));
  list.innerHTML = sorted.map(item => `
    <li class="anni-item">
      <span class="anni-item-dot"></span>
      <span class="anni-item-date">${fmtDate(item.date)}</span>
      <span class="anni-item-event">${esc(item.event)}</span>
      <button class="anni-item-del" onclick="deleteAnniversary('${item.date}','${item.event.replace(/'/g,"\\'")}')">✕</button>
    </li>
  `).join('');
}

async function addAnniversary() {
  const date  = $('anniDate').value.trim();
  const event = $('anniEvent').value.trim();
  if (!date)  { showToast('请选择日期'); shake($('anniDate'));  return; }
  if (!event) { showToast('请填写纪念日名称'); shake($('anniEvent')); return; }
  anniversaries.push({ date, event });
  await lsSet('couple_anniversaries', anniversaries);
  renderAnniversaries();
  $('anniDate').value  = '';
  $('anniEvent').value = '';
  showToast('纪念日已添加 🗓');
}

async function deleteAnniversary(date, event) {
  anniversaries = anniversaries.filter(a => !(a.date === date && a.event === event));
  await lsSet('couple_anniversaries', anniversaries);
  renderAnniversaries();
  showToast('已删除');
}

/* ==============================================================
   板块4：记仇本
   ============================================================== */
let grudgeCount = 0;

async function initGrudge() {
  grudgeCount = await lsGet('couple_grudge') || 0;
  $('grudgeLimitDisp') && ($('grudgeLimitDisp').textContent = GRUDGE_LIMIT);
  renderGrudge();
}

function renderGrudge() {
  const now = new Date();
  const mEl = $('grudgeMonth');
  if (mEl) mEl.textContent = `${now.getFullYear()} 年 ${now.getMonth()+1} 月`;

  const pct = Math.min(grudgeCount / GRUDGE_LIMIT * 100, 100);
  const fill = $('grudgeFill');
  if (fill) fill.style.width = pct + '%';

  const ptEl = $('grudgeProgressText');
  if (ptEl) ptEl.textContent = `${grudgeCount} / ${GRUDGE_LIMIT} 次`;

  const numEl = $('grudgeNum');
  if (numEl) { numEl.textContent = grudgeCount; }

  const st = $('grudgeStatus');
  if (st) {
    if (grudgeCount >= GRUDGE_LIMIT) {
      st.innerHTML = '🎁 已达上限！本月必须送礼物！';
      st.style.color = 'var(--rose-deep)';
    } else if (grudgeCount >= GRUDGE_LIMIT * 0.7) {
      st.innerHTML = `😤 快到上限了！还差 ${GRUDGE_LIMIT - grudgeCount} 次！`;
      st.style.color = 'var(--caramel)';
    } else if (grudgeCount > 0) {
      st.innerHTML = `📝 本月已记 ${grudgeCount} 次，要好好回消息哦！`;
      st.style.color = 'var(--text-mid)';
    } else {
      st.innerHTML = '✅ 本月记录为零，好棒棒！';
      st.style.color = '#2d8b4e';
    }
  }
}

async function changeGrudge(delta) {
  grudgeCount = Math.max(0, grudgeCount + delta);
  await lsSet('couple_grudge', grudgeCount);
  const el = $('grudgeNum');
  if (el) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300); }
  renderGrudge();
  if (grudgeCount >= GRUDGE_LIMIT && delta > 0) showToast('🎁 满额！本月需送礼物！', 3000);
}

async function setGrudge() {
  const inp = $('grudgeManualInput');
  const val = parseInt(inp.value);
  if (isNaN(val) || val < 0) { showToast('请输入有效次数'); shake(inp); return; }
  grudgeCount = val;
  inp.value = '';
  await lsSet('couple_grudge', grudgeCount);
  renderGrudge();
  showToast(`次数已设为 ${grudgeCount}`);
}

async function resetGrudge() {
  if (!confirm('确认清零本月记录？')) return;
  grudgeCount = 0;
  await lsSet('couple_grudge', 0);
  renderGrudge();
  showToast('已清零 ✅');
}

/* ==============================================================
   板块5：心愿清单
   ============================================================== */
let wishes    = [];
let activeWishId = null;

async function initWishlist() {
  wishes = await lsGet('couple_wishes') || [];
  renderWishes();
}

function renderWishes() {
  const grid = $('wishGrid');
  if (!grid) return;
  if (wishes.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#a07878;font-style:italic;padding:40px 0">还没有心愿，写下第一个吧 🌟</p>';
    return;
  }
  grid.innerHTML = wishes.map(w => `
    <div class="wish-card ${w.done ? 'done' : ''}" onclick="openWishModal(${w.id})">
      <span class="wish-card-star">${w.done ? '✅' : '🌟'}</span>
      <div class="wish-card-text">${esc(w.text)}</div>
      <div class="wish-card-time">${fmtTime(w.time)}</div>
      ${w.done ? '<span class="wish-done-badge">已达成</span>' : ''}
    </div>
  `).join('');
}

async function addWish() {
  const inp  = $('wishInput');
  const text = inp ? inp.value.trim() : '';
  if (!text) { showToast('写下你的心愿 🌟'); shake(inp); return; }
  wishes.unshift({ id: Date.now(), text, time: Date.now(), done: false });
  await lsSet('couple_wishes', wishes);
  inp.value = '';
  renderWishes();
  showToast('心愿已许下 🌟');
}

function openWishModal(id) {
  activeWishId = id;
  const w = wishes.find(x => x.id === id);
  if (!w) return;
  $('modalWishTitle').textContent = w.text;
  $('modalWishTime').textContent  = '许愿时间：' + fmtTime(w.time);
  $('modalEditWrap').classList.add('hidden');
  $('modalEditInput').value = '';
  $('wishModal').classList.remove('hidden');
}
function closeWishModal() {
  $('wishModal').classList.add('hidden');
  activeWishId = null;
}

function editWish() {
  const wrap = $('modalEditWrap');
  const inp  = $('modalEditInput');
  const w    = wishes.find(x => x.id === activeWishId);
  if (!w) return;
  wrap.classList.remove('hidden');
  inp.value = w.text;
  inp.focus();
}
async function saveWishEdit() {
  const text = $('modalEditInput').value.trim();
  if (!text) { showToast('请输入内容'); shake($('modalEditInput')); return; }
  const w = wishes.find(x => x.id === activeWishId);
  if (!w) return;
  w.text = text;
  await lsSet('couple_wishes', wishes);
  renderWishes();
  closeWishModal();
  showToast('心愿已修改 ✏️');
}

async function completeWish() {
  const w = wishes.find(x => x.id === activeWishId);
  if (!w) return;
  w.done = !w.done;
  await lsSet('couple_wishes', wishes);
  renderWishes();
  closeWishModal();
  showToast(w.done ? '🎉 心愿已达成！恭喜！' : '已取消达成标记');
}

async function deleteWish() {
  if (!confirm('确认删除这个心愿？')) return;
  wishes = wishes.filter(x => x.id !== activeWishId);
  await lsSet('couple_wishes', wishes);
  renderWishes();
  closeWishModal();
  showToast('心愿已删除');
}

$('wishInput') && $('wishInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addWish();
});

/* ==============================================================
   ESC 关闭弹窗
   ============================================================== */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeWishModal();
    closeReplyModal();
    closeImgPreview();
    closeNav();
  }
});

/* ==============================================================
   滚动入场动画
   ============================================================== */
function initScrollAnim() {
  const targets = document.querySelectorAll('.section-header, .album-cell, .whisper-note, .anni-item, .wish-card, .grudge-card');
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  targets.forEach((el, i) => {
    el.classList.add('fade-up');
    el.style.transitionDelay = `${(i % 5) * 0.06}s`;
    obs.observe(el);
  });
}
