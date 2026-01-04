// Büyük Türk Klasikleri - app.js
// metin.txt formatı:
// 1) Orijinal 1. satır
// 2) Orijinal 2. satır + (Şair)
// 3) Günümüz Türkçesi (tek satır)
// 4) Boş satır (ayraç)

let items = [];
let idx = 0;

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTextToItems(text) {
  const rawLines = text.split(/\r?\n/);
  const poetRe = /\(([^)]+)\)\s*$/;

  const out = [];
  let block = [];

  function flushBlock() {
    if (block.length === 0) return;

    const lines = block.map(s => s.trim()).filter(Boolean);

    // En az 3 satır: orijinal1, orijinal2(+şair), modern
    if (lines.length >= 3) {
      const l1 = lines[0];
      const l2 = lines[1];
      const l3 = lines[2];

      const m = l2.match(poetRe);
      const poet = m ? m[1].trim() : "";
      const original2 = l2.replace(poetRe, "").trim();

      out.push({
        poet,
        original: [l1, original2],
        modern: l3
      });
    }

    block = [];
  }

  for (const ln of rawLines) {
    if (ln.trim() === "") flushBlock();
    else block.push(ln);
  }
  flushBlock();

  return out;
}

function renderEmpty(message1, message2) {
  document.getElementById("poetTitle").textContent = "Veri yok";
  document.getElementById("originalBox").innerHTML =
    `<div class="line">${escapeHtml(message1 || "")}</div>` +
    `<div class="line">${escapeHtml(message2 || "")}</div>`;
  document.getElementById("modernBox").textContent = "metin.txt aynı klasörde olmalı.";
  document.getElementById("counter").textContent = "0 / 0";
}

function render() {
  if (!items.length) {
    renderEmpty("metin.txt okunamadı", "ya da içinde kayıt yok");
    return;
  }

  // döngülü gezinme
  idx = ((idx % items.length) + items.length) % items.length;
  const cur = items[idx];

  document.getElementById("poetTitle").textContent = cur.poet || "—";

  document.getElementById("originalBox").innerHTML =
    `<div class="line">${escapeHtml(cur.original?.[0] || "")}</div>` +
    `<div class="line">${escapeHtml(cur.original?.[1] || "")}</div>`;

  document.getElementById("modernBox").textContent = cur.modern || "";
  document.getElementById("counter").textContent = `${idx + 1} / ${items.length}`;

  document.getElementById("btnPrev").disabled = items.length <= 1;
  document.getElementById("btnNext").disabled = items.length <= 1;
}

function prev() {
  if (!items.length) return;
  idx = (idx - 1 + items.length) % items.length;
  render();
}

function next() {
  if (!items.length) return;
  idx = (idx + 1) % items.length;
  render();
}

function randomPick() {
  if (!items.length) return;
  idx = Math.floor(Math.random() * items.length);
  render();
}

function bindUI() {
  document.getElementById("btnPrev").addEventListener("click", prev);
  document.getElementById("btnNext").addEventListener("click", next);
  document.getElementById("btnRandom").addEventListener("click", randomPick);

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "r" || e.key === "R") randomPick();
  });
}

async function init() {
  try {
    const res = await fetch("metin.txt", { cache: "no-store" });
    if (!res.ok) throw new Error("metin.txt bulunamadı");
    const text = await res.text();

    items = parseTextToItems(text);

    if (!items.length) {
      renderEmpty("metin.txt okundu", "ama kayıt bulunamadı");
      return;
    }

    render();
    bindUI();
  } catch (err) {
    renderEmpty("metin.txt bulunamadı", "Aynı klasöre koy");
  }
}

init();
