const API_URL = "https://mama-converter-api.vercel.app/api/convert";

const urlsEl = document.getElementById("urls");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const copyAllBtn = document.getElementById("copyAllBtn");
const resultBox = document.getElementById("resultBox");
const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");

let convertedLinks = [];

function getUrls() {
  return urlsEl.value
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function setStatus(message) {
  statusEl.hidden = !message;
  statusEl.textContent = message || "";
}

function renderResults(links) {
  convertedLinks = links.filter(Boolean);
  resultsEl.innerHTML = "";

  convertedLinks.forEach((link) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link;
    li.appendChild(a);
    resultsEl.appendChild(li);
  });

  resultBox.hidden = convertedLinks.length === 0;
}

async function convertLinks() {
  const urls = getUrls();

  if (!urls.length) {
    setStatus("請先貼上蝦皮連結");
    resultBox.hidden = true;
    return;
  }

  if (urls.length < urlsEl.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean).length) {
    setStatus("最多轉換 5 個連結");
  } else {
    setStatus("");
  }

  convertBtn.disabled = true;
  convertBtn.textContent = "轉換中…";
  resultBox.hidden = true;
  convertedLinks = [];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "轉換失敗");
    }

    const links = Array.isArray(data.results)
      ? data.results.map(item => item && (item.shortLink || item.shortlink || item.url)).filter(Boolean)
      : [];

    if (!links.length) {
      throw new Error("沒有取得推廣連結");
    }

    renderResults(links);
    setStatus(`完成，共產生 ${links.length} 個推廣連結`);
  } catch (error) {
    resultBox.hidden = true;
    setStatus(error.message || "轉換失敗，請稍後再試");
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = "產生推廣連結";
  }
}

async function copyAll() {
  if (!convertedLinks.length) return;

  try {
    await navigator.clipboard.writeText(convertedLinks.join("\n"));
    copyAllBtn.textContent = "已複製";
    setTimeout(() => {
      copyAllBtn.textContent = "一鍵複製全部";
    }, 1200);
  } catch {
    const temp = document.createElement("textarea");
    temp.value = convertedLinks.join("\n");
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    copyAllBtn.textContent = "已複製";
    setTimeout(() => {
      copyAllBtn.textContent = "一鍵複製全部";
    }, 1200);
  }
}

convertBtn.addEventListener("click", convertLinks);

clearBtn.addEventListener("click", () => {
  urlsEl.value = "";
  convertedLinks = [];
  resultsEl.innerHTML = "";
  resultBox.hidden = true;
  setStatus("");
  urlsEl.focus();
});

copyAllBtn.addEventListener("click", copyAll);
