// SHPORA Engine: Fast live search, filtering, copying, and rendering
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const pinnedCodeEl = document.getElementById("pinnedCodeBlock");
  const btnCopyPinned = document.getElementById("btnCopyPinned");
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const cardsContainer = document.getElementById("cardsContainer");
  const filterChips = document.querySelectorAll(".filter-chip");
  const btnExpandAll = document.getElementById("btnExpandAll");
  const btnCollapseAll = document.getElementById("btnCollapseAll");
  const btnToggleTheme = document.getElementById("btnToggleTheme");
  const totalCountEl = document.getElementById("totalCount");
  const theoryCountEl = document.getElementById("theoryCount");
  const practiceCountEl = document.getElementById("practiceCount");
  const btnScrollTop = document.getElementById("btnScrollTop");

  // State
  let currentFilter = "all";
  let searchQuery = "";
  let allCards = [];

  // Initialize Pinned Code
  const pinnedBlock = document.getElementById("pinnedBlock");
  const pinnedHeader = document.getElementById("pinnedHeader");
  const btnTogglePinned = document.getElementById("btnTogglePinned");
  const pinnedToggleText = document.getElementById("pinnedToggleText");
  const pinnedChevron = document.getElementById("pinnedChevron");

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

  if (totalCountEl) totalCountEl.textContent = (THEORY_DATA.length + PRACTICE_DATA.length);
  if (theoryCountEl) theoryCountEl.textContent = THEORY_DATA.length;
  if (practiceCountEl) practiceCountEl.textContent = PRACTICE_DATA.length;

  // Copy Pinned Code (without needing to open it!)
  btnCopyPinned.addEventListener("click", (e) => {
    e.stopPropagation();
    copyToClipboard(BANK_ACCOUNT_CODE, btnCopyPinned, "Скопировано", "Копировать код");
  });

  // Build unified item list
  const items = [];

  // Theory items
  THEORY_DATA.forEach(t => {
    items.push({
      type: "theory",
      id: t.id,
      num: t.num,
      sec: t.sec,
      title: t.q,
      short: t.short,
      bodyHtml: t.ans,
      plainTextToCopy: `${t.q}\n\nКратко: ${t.short}\n\nПодробно:\n${stripHtml(t.ans)}`,
      tags: t.tags || [],
      searchStr: `${t.num} т${t.num} в${t.num} билет ${t.num} вопрос ${t.num} ${t.q} ${t.short} ${stripHtml(t.ans)} ${(t.tags || []).join(" ")} ${t.sec}`.toLowerCase()
    });
  });

  // Practice items
  PRACTICE_DATA.forEach(p => {
    items.push({
      type: "practice",
      id: p.id,
      num: p.num,
      sec: "Практические задания по программированию",
      title: p.task,
      short: p.desc,
      code: p.code,
      plainTextToCopy: p.code,
      tags: p.tags || [],
      searchStr: `${p.num} п${p.num} з${p.num} задача ${p.num} практика ${p.num} ${p.task} ${p.desc} ${p.code} ${(p.tags || []).join(" ")}`.toLowerCase()
    });
  });

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

  // Expand / Collapse All
  btnExpandAll.addEventListener("click", () => {
    document.querySelectorAll(".card").forEach(c => c.classList.add("expanded"));
  });

  btnCollapseAll.addEventListener("click", () => {
    document.querySelectorAll(".card").forEach(c => c.classList.remove("expanded"));
  });

  // Theme switch
  const savedTheme = localStorage.getItem("shpora_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButton(savedTheme);

  btnToggleTheme.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("shpora_theme", nextTheme);
    updateThemeButton(nextTheme);
  });

  function updateThemeButton(theme) {
    btnToggleTheme.textContent = theme === "light" ? "Тёмная" : "Светлая";
  }

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
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить запрос (например: "init", "класс", "файлы", "14")</p>
        </div>
      `;
      return;
    }

    // Grouping by Section for neat display
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
      const copyBtnLabel = isTheory ? "Ответ" : "Код";

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
              <span>Python 3 Code</span>
              <button class="btn-copy-code" data-id="${item.id}">📋 Копировать код</button>
            </div>
            <pre><code class="lang-python">${escapeHtml(item.code)}</code></pre>
          </div>
          <div style="font-size:0.86rem; color: var(--text-secondary); margin-top:6px;">
            💡 <b>Суть решения:</b> ${escapeHtml(item.short)}
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
              <button class="btn-card-copy" onclick="copyCardContent('${item.id}', this)" title="Скопировать">
                ${copyBtnLabel}
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

    // Attach listeners to practice inner copy buttons
    document.querySelectorAll(".btn-copy-code").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = items.find(i => i.id === id);
        if (item) {
          copyToClipboard(item.code, btn, "✓ Скопировано!", "📋 Копировать код");
        }
      });
    });
  }

  // Global functions attached to window
  window.toggleCard = function(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.classList.toggle("expanded");
    }
  };

  window.copyCardContent = function(id, btn) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const defaultText = item.type === "theory" ? "Ответ" : "Код";
    copyToClipboard(item.plainTextToCopy, btn, "Скопировано", defaultText);
  };

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
      }, 1600);
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
