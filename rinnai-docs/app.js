const TYPE_LABELS = {
  "certification-listings": "Certification",
  "component-replacement": "Component Replacement",
  "conversion-manuals": "Conversion Manual",
  "energy-guide-labels": "Energy Guide",
  "installation-owner-manuals": "Install / Owner Manual",
  "specification-sheets": "Specification Sheet",
  "system-design-drawings": "System Design Drawing",
  "technical-bulletins": "Technical Bulletin",
  "technical-data-sheets": "Technical Data Sheet",
  warranties: "Warranty",
};

const state = {
  docs: [],
  query: "",
  building: "",
  category: "",
  typeSlug: "",
  language: "",
  sort: "title",
};

const els = {
  list: document.getElementById("doc-list"),
  search: document.getElementById("search"),
  clearSearch: document.getElementById("clear-search"),
  count: document.getElementById("result-count"),
  loading: document.getElementById("loading"),
  empty: document.getElementById("empty"),
  chips: document.getElementById("quick-chips"),
  filterBuilding: document.getElementById("filter-building"),
  filterCategory: document.getElementById("filter-category"),
  filterType: document.getElementById("filter-type"),
  filterLanguage: document.getElementById("filter-language"),
  filterSort: document.getElementById("filter-sort"),
  filterReset: document.getElementById("filter-reset"),
  filterApply: document.getElementById("filter-apply"),
  filterPanel: document.getElementById("filters-panel"),
  filterOverlay: document.getElementById("filter-overlay"),
  openFilters: document.getElementById("open-filters"),
  closeFilters: document.getElementById("close-filters"),
  catalogDate: document.getElementById("catalog-date"),
};

function labelType(slug) {
  return TYPE_LABELS[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeDoc(raw) {
  const title = raw.title || "Untitled document";
  return {
    ...raw,
    searchText: [
      title,
      raw.category,
      raw.models,
      raw.building_type,
      raw.product_type,
      raw.language,
      labelType(raw.type_slug),
      raw.id,
    ]
      .join(" ")
      .toLowerCase(),
    typeLabel: labelType(raw.type_slug),
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function populateSelect(select, values, placeholder) {
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
  select.value = current;
}

function buildFilterOptions() {
  populateSelect(
    els.filterBuilding,
    uniqueSorted(state.docs.map((d) => d.building_type)),
    "All building types"
  );
  populateSelect(
    els.filterCategory,
    uniqueSorted(state.docs.map((d) => d.category)),
    "All categories"
  );
  els.filterType.innerHTML = '<option value="">All document types</option>';
  uniqueSorted(state.docs.map((d) => d.type_slug)).forEach((slug) => {
    const opt = document.createElement("option");
    opt.value = slug;
    opt.textContent = labelType(slug);
    els.filterType.appendChild(opt);
  });

  populateSelect(
    els.filterLanguage,
    uniqueSorted(
      state.docs.flatMap((d) =>
        String(d.language || "")
          .split("|")
          .map((s) => s.trim())
      )
    ),
    "All languages"
  );
}

function buildQuickChips() {
  const presets = [
    { label: "All", building: "", typeSlug: "" },
    { label: "Residential", building: "residential", typeSlug: "" },
    { label: "Commercial", building: "commercial", typeSlug: "" },
    { label: "Manuals", building: "", typeSlug: "installation-owner-manuals" },
    { label: "Spec Sheets", building: "", typeSlug: "specification-sheets" },
    { label: "Warranty", building: "", typeSlug: "warranties" },
  ];
  els.chips.innerHTML = "";
  presets.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = p.label;
    btn.dataset.building = p.building;
    btn.dataset.type = p.typeSlug;
    if (state.building === p.building && state.typeSlug === p.typeSlug && !state.query) {
      btn.classList.add("is-active");
    }
    btn.addEventListener("click", () => {
      state.building = p.building;
      state.typeSlug = p.typeSlug;
      els.filterBuilding.value = p.building;
      els.filterType.value = p.typeSlug;
      syncChips();
      render();
    });
    els.chips.appendChild(btn);
  });
}

function syncChips() {
  els.chips.querySelectorAll(".chip").forEach((chip) => {
    const active =
      chip.dataset.building === state.building &&
      chip.dataset.type === state.typeSlug &&
      !state.query;
    chip.classList.toggle("is-active", active);
  });
}

function getFilteredDocs() {
  const q = state.query.trim().toLowerCase();
  let results = state.docs.filter((doc) => {
    if (q && !doc.searchText.includes(q)) return false;
    if (state.building && doc.building_type !== state.building) return false;
    if (state.category && doc.category !== state.category) return false;
    if (state.typeSlug && doc.type_slug !== state.typeSlug) return false;
    if (state.language) {
      const langs = String(doc.language || "")
        .split("|")
        .map((s) => s.trim());
      if (!langs.includes(state.language)) return false;
    }
    return true;
  });

  if (state.sort === "category") {
    results.sort((a, b) =>
      (a.category || "").localeCompare(b.category || "") ||
      a.title.localeCompare(b.title)
    );
  } else {
    results.sort((a, b) => a.title.localeCompare(b.title));
  }
  return results;
}

function renderCard(doc) {
  const li = document.createElement("li");
  const langs = String(doc.language || "English")
    .split("|")
    .map((s) => s.trim())
    .join(", ");

  li.innerHTML = `
    <a class="doc-card" href="${doc.url}" target="_blank" rel="noopener noreferrer">
      <h2>${escapeHtml(doc.title)}</h2>
      <div class="doc-meta">
        <span class="badge type">${escapeHtml(doc.typeLabel)}</span>
        ${doc.category ? `<span class="badge">${escapeHtml(doc.category)}</span>` : ""}
        ${doc.building_type ? `<span class="badge">${escapeHtml(capitalize(doc.building_type))}</span>` : ""}
        <span class="badge">${escapeHtml(langs)}</span>
      </div>
      <div class="doc-actions">
        <span class="btn primary">Open PDF</span>
        <span class="btn" role="presentation">#${escapeHtml(String(doc.id))}</span>
      </div>
    </a>
  `;
  return li;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render() {
  const results = getFilteredDocs();
  els.list.innerHTML = "";
  els.count.textContent = `${results.length} document${results.length === 1 ? "" : "s"}`;

  if (!results.length) {
    els.empty.hidden = false;
    return;
  }
  els.empty.hidden = true;

  const fragment = document.createDocumentFragment();
  results.forEach((doc) => fragment.appendChild(renderCard(doc)));
  els.list.appendChild(fragment);
}

function readFiltersFromPanel() {
  state.building = els.filterBuilding.value;
  state.category = els.filterCategory.value;
  state.typeSlug = els.filterType.value;
  state.language = els.filterLanguage.value;
  state.sort = els.filterSort.value || "title";
}

function resetFilters() {
  state.building = "";
  state.category = "";
  state.typeSlug = "";
  state.language = "";
  state.sort = "title";
  state.query = "";
  els.search.value = "";
  els.filterBuilding.value = "";
  els.filterCategory.value = "";
  els.filterType.value = "";
  els.filterLanguage.value = "";
  els.filterSort.value = "title";
  syncChips();
  render();
}

function openFilterPanel() {
  els.filterPanel.classList.add("open");
  els.filterOverlay.classList.add("open");
}

function closeFilterPanel() {
  els.filterPanel.classList.remove("open");
  els.filterOverlay.classList.remove("open");
}

async function loadCatalog() {
  const res = await fetch("catalog.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load catalog.json");
  const data = await res.json();
  state.docs = (data.documents || []).map(normalizeDoc);
  if (els.catalogDate && data.generated_at) {
    const d = new Date(data.generated_at);
    els.catalogDate.textContent = `Updated ${d.toLocaleDateString()}`;
  }
  buildFilterOptions();
  buildQuickChips();
  els.loading.hidden = true;
  render();
}

function bindEvents() {
  let debounce;
  els.search.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.query = els.search.value;
      syncChips();
      render();
    }, 180);
  });

  els.clearSearch.addEventListener("click", () => {
    els.search.value = "";
    state.query = "";
    syncChips();
    render();
    els.search.focus();
  });

  els.openFilters.addEventListener("click", openFilterPanel);
  els.closeFilters.addEventListener("click", closeFilterPanel);
  els.filterOverlay.addEventListener("click", closeFilterPanel);

  els.filterApply.addEventListener("click", () => {
    readFiltersFromPanel();
    syncChips();
    render();
    closeFilterPanel();
  });

  els.filterReset.addEventListener("click", resetFilters);
}

bindEvents();
loadCatalog().catch((err) => {
  els.loading.innerHTML = `<p>Failed to load catalog.<br>${escapeHtml(err.message)}</p>`;
  console.error(err);
});