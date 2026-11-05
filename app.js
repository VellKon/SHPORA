// SHPORA Engine — Pure Client-side JS, 100% compatible with GitHub Pages
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const pinnedCodeEl = document.getElementById("pinnedCodeBlock");
  const pinnedBlock = document.getElementById("pinnedBlock");
  const pinnedHeader = document.getElementById("pinnedHeader");
  const btnCopyPinned = document.getElementById("btnCopyPinned");
  const btnDownloadPinned = document.getElementById("btnDownloadPinned");
  const btnTogglePinned = document.getElementById("btnTogglePinned");
  const pinnedToggleText = document.getElementById("pinnedToggleText");
  const pinnedChevron = document.getElementById("pinnedChevron");

  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const cardsContainer = document.getElementById("cardsContainer");
  const filterChips = document.querySelectorAll(".filter-chip");
  const btnScrollTop = document.getElementById("btnScrollTop");

  // State
  let currentFilter = "all";
  let searchQuery = "";

  // Initialize Pinned Code
  if (pinnedCodeEl && typeof BANK_ACCOUNT_CODE !== "undefined") {
    pinnedCodeEl.textContent = BANK_ACCOUNT_CODE;
  }

  // Toggle Pinned Code accordion
  function togglePinnedCode(expandOnly = false) {
    if (!pinnedBlock) return;
    const isExpanded = pinnedBlock.classList.contains("expanded");
    if (expandOnly && isExpanded) return;

    if (expandOnly || !isExpanded) {
      pinnedBlock.classList.add("expanded");
      if (pinnedToggleText) pinnedToggleText.textContent = "Скрыть";
      if (pinnedChevron) pinnedChevron.textContent = "▲";
    } else {
      pinnedBlock.classList.remove("expanded");
      if (pinnedToggleText) pinnedToggleText.textContent = "Показать";
      if (pinnedChevron) pinnedChevron.textContent = "▼";
    }
  }

  if (pinnedHeader) {
    pinnedHeader.addEventListener("click", () => togglePinnedCode());
  }
  if (btnTogglePinned) {
    btnTogglePinned.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePinnedCode();
    });
  }

  // Copy Pinned Code
  if (btnCopyPinned) {
    btnCopyPinned.addEventListener("click", (e) => {
      e.stopPropagation();
      copyToClipboard(BANK_ACCOUNT_CODE, btnCopyPinned, "Скопировано", "Копировать");
    });
  }

  // Download Pinned Code as innocent txt
  if (btnDownloadPinned) {
    btnDownloadPinned.addEventListener("click", (e) => {
      e.stopPropagation();
      downloadAsTxt(BANK_ACCOUNT_CODE, "script_main.txt");
    });
  }

  // Build unified item list
  const items = [];

  // Theory items
  if (typeof THEORY_DATA !== "undefined") {
    THEORY_DATA.forEach(t => {
      const plainAnswer = stripHtml(t.ans);
      const textToSave = `${t.q}\n\n${t.short}\n\n${plainAnswer}`;

      items.push({
        type: "theory",
        id: t.id,
        num: t.num,
        sec: t.sec,
        title: t.q,
        short: t.short,
        bodyHtml: t.ans,
        plainTextToCopy: textToSave,
        tags: t.tags || [],
        searchStr: `${t.num} т${t.num} в${t.num} билет ${t.num} вопрос ${t.num} ${t.q} ${t.short} ${plainAnswer} ${(t.tags || []).join(" ")} ${t.sec}`.toLowerCase()
      });
    });
  }

  // Practice items
  if (typeof PRACTICE_DATA !== "undefined") {
    PRACTICE_DATA.forEach(p => {
      const textToSave = `# ${p.task}\n# Пояснение: ${p.desc}\n\n${p.code}`;

      items.push({
        type: "practice",
        id: p.id,
        num: p.num,
        sec: "Практические задания по программированию",
        title: p.task,
        short: p.desc,
        code: p.code,
        plainTextToCopy: p.code,
        plainTextToDownload: textToSave,
        tags: p.tags || [],
        searchStr: `${p.num} п${p.num} з${p.num} задача ${p.num} практика ${p.num} ${p.task} ${p.desc} ${p.code} ${(p.tags || []).join(" ")}`.toLowerCase()
      });
    });
  }

  // Render cards initially
  renderCards(items);

  // Search input handler
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    searchClear.style.display = searchQuery ? "block" : "none";
    filterAndRender();
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    searchClear.style.display = "none";
    searchInput.focus();
    filterAndRender();
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    } else if (e.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      searchQuery = "";
      searchClear.style.display = "none";
      filterAndRender();
      searchInput.blur();
    }
  });

  // Filter chips click
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentFilter = chip.dataset.filter;

      if (currentFilter === "bank") {
        togglePinnedCode(true);
        document.getElementById("pinnedBlock").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      filterAndRender();
    });
  });

  // Scroll to top
  if (btnScrollTop) {
    btnScrollTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Filter and Render logic
  function filterAndRender() {
    let filtered = items;

    // Filter by type or section
    if (currentFilter === "theory") {
      filtered = filtered.filter(i => i.type === "theory");
    } else if (currentFilter === "practice") {
      filtered = filtered.filter(i => i.type === "practice");
    } else if (currentFilter.startsWith("sec-")) {
      const secNum = currentFilter.replace("sec-", "");
      filtered = filtered.filter(i => i.sec && i.sec.startsWith(`Раздел ${secNum}.`));
    }

    // Filter by search query
    if (searchQuery) {
      const qTokens = searchQuery.split(/\s+/).filter(Boolean);
      filtered = filtered.filter(item => {
        return qTokens.every(token => item.searchStr.includes(token));
      });
    }

    renderCards(filtered, searchQuery);
  }

  function renderCards(list, highlightTerm = "") {
    if (!list.length) {
      cardsContainer.innerHTML = `
        <div class="no-results">
          Ничего не найдено
        </div>
      `;
      return;
    }

    let html = "";
    let currentSec = null;

    list.forEach(item => {
      if (item.sec !== currentSec) {
        currentSec = item.sec;
        html += `<h2 class="section-heading">${escapeHtml(currentSec)}</h2><div class="cards-grid">`;
      }

      const isTheory = item.type === "theory";
      const badgeText = isTheory ? `Теория ${item.num}` : `Практика ${item.num}`;
      const badgeClass = isTheory ? "badge-theory" : "badge-practice";

      let titleHtml = escapeHtml(item.title);
      let shortHtml = escapeHtml(item.short);

      if (highlightTerm) {
        titleHtml = highlightMatches(titleHtml, highlightTerm);
        shortHtml = highlightMatches(shortHtml, highlightTerm);
      }

      let bodyContent = "";
      if (isTheory) {
        bodyContent = item.bodyHtml;
      } else {
        bodyContent = `
          <div class="practice-code-wrap">
            <div class="practice-code-header">
              <span>Python 3</span>
              <div>
                <button class="btn-copy-code" data-id="${item.id}">Копировать код</button>
                <button class="btn-dl-code" data-id="${item.id}">TXT</button>
              </div>
            </div>
            <pre><code class="lang-python">${escapeHtml(item.code)}</code></pre>
          </div>
          <div style="font-size:0.84rem; color: var(--text-muted); margin-top:4px;">
            Суть: ${escapeHtml(item.short)}
          </div>
        `;
      }

      html += `
        <div class="card" id="card-${item.id}">
          <div class="card-header" onclick="toggleCard('${item.id}')">
            <div class="card-title-group">
              <span class="card-badge ${badgeClass}">${badgeText}</span>
              <div style="flex: 1; min-width: 0;">
                <div class="card-title">${titleHtml}</div>
                <div class="card-short-preview">${shortHtml}</div>
              </div>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
              <button class="btn-action" onclick="copyCardContent('${item.id}', this)" title="Скопировать">
                Копировать
              </button>
              <button class="btn-action btn-action-subtle" onclick="downloadCardContent('${item.id}')" title="Скачать .txt">
                TXT
              </button>
              <span class="chevron" onclick="toggleCard('${item.id}')">▼</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-body-content">
              ${bodyContent}
            </div>
          </div>
        </div>
      `;
    });

    cardsContainer.innerHTML = html;

    // Attach listeners for inner practice buttons
    document.querySelectorAll(".btn-copy-code").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = items.find(i => i.id === id);
        if (item) {
          copyToClipboard(item.code, btn, "Скопировано", "Копировать код");
        }
      });
    });

    document.querySelectorAll(".btn-dl-code").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        downloadCardContent(id);
      });
    });
  }

  // Global functions
  window.toggleCard = function(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.classList.toggle("expanded");
    }
  };

  window.copyCardContent = function(id, btn) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    copyToClipboard(item.plainTextToCopy, btn, "Скопировано", "Копировать");
  };

  // Download client-side txt with disguised names
  window.downloadCardContent = function(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const content = item.type === "practice" ? item.plainTextToDownload : item.plainTextToCopy;
    
    // Disguised neutral filenames that look like ordinary school notes or system logs
    const prefixes = item.type === "theory" ? ["doc", "note", "draft", "part"] : ["calc", "code", "task", "unit"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const padNum = String(item.num).padStart(2, "0");
    const filename = `${randomPrefix}_${padNum}.txt`;

    downloadAsTxt(content, filename);
  };

  function downloadAsTxt(text, filename) {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Download error:", err);
    }
  }

  // Helper copy function
  function copyToClipboard(text, btnElement, successText, originalText) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showSuccess()).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showSuccess();
      } catch (err) {
        console.error("Ошибка копирования:", err);
      }
      textArea.remove();
    }

    function showSuccess() {
      btnElement.classList.add("copied");
      btnElement.innerHTML = successText;
      setTimeout(() => {
        btnElement.classList.remove("copied");
        btnElement.innerHTML = originalText;
      }, 1400);
    }
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  function highlightMatches(text, term) {
    if (!term) return text;
    const tokens = term.split(/\s+/).filter(Boolean);
    let result = text;
    tokens.forEach(tok => {
      const reg = new RegExp(`(${escapeRegex(tok)})`, "gi");
      result = result.replace(reg, "<mark>$1</mark>");
    });
    return result;
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
});
