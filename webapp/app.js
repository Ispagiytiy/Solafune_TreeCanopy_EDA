const METADATA_URL = "../train_annotations_updated_504bcc9e05b54435a9a56a841a3a1cf5.json";
const IMAGES_BASE = "../train_images_png";

const state = {
  images: [],
  filtered: [],
  page: 1,
  perPage: 12,
  filter: {
    search: "",
    resolutions: [],
    scenes: [],
  },
  overlay: {
    individual: { color: "#8342C4" },
    group: { color: "#126DD6" },
  },
};

const elements = {
  search: document.getElementById("search"),
  resolution: document.getElementById("resolution"),
  scene: document.getElementById("scene"),
  count: document.getElementById("count"),
  individualColor: document.getElementById("individualColor"),
  groupColor: document.getElementById("groupColor"),
  applyFilters: document.getElementById("applyFilters"),
  resetFilters: document.getElementById("resetFilters"),
  resultCount: document.getElementById("resultCount"),
  pageInfo: document.getElementById("pageInfo"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  cards: document.getElementById("cards"),
  emptyState: document.getElementById("emptyState"),
};

const toPngName = (name) => name.replace(/\.tif$/i, ".png");

const createOption = (value) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  return option;
};

const populateSelect = (select, values) => {
  select.innerHTML = "";
  values.forEach((value) => select.appendChild(createOption(value)));
};

const updateStateFromFilters = () => {
  state.filter.search = elements.search.value.trim().toLowerCase();
  state.filter.resolutions = Array.from(elements.resolution.selectedOptions).map(
    (option) => Number(option.value)
  );
  state.filter.scenes = Array.from(elements.scene.selectedOptions).map(
    (option) => option.value
  );
  state.perPage = Number(elements.count.value);
};

const applyFilters = () => {
  updateStateFromFilters();
  const f = state.filter;
  state.filtered = state.images.filter((item) => {
    if (f.search && !item.file_name.toLowerCase().includes(f.search)) {
      return false;
    }
    if (f.resolutions.length && !f.resolutions.includes(item.cm_resolution)) {
      return false;
    }
    if (f.scenes.length && !f.scenes.includes(item.scene_type)) {
      return false;
    }
    return true;
  });
  state.page = 1;
  render();
};

const resetFilters = () => {
  elements.search.value = "";
  Array.from(elements.resolution.options).forEach((option) => {
    option.selected = false;
  });
  Array.from(elements.scene.options).forEach((option) => {
    option.selected = false;
  });
  elements.count.value = "12";
  applyFilters();
};

const setupControls = () => {
  elements.applyFilters.addEventListener("click", applyFilters);
  elements.resetFilters.addEventListener("click", resetFilters);
  elements.prevPage.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      render();
    }
  });
  elements.nextPage.addEventListener("click", () => {
    const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
    if (state.page < maxPage) {
      state.page += 1;
      render();
    }
  });
  elements.count.addEventListener("change", () => {
    state.perPage = Number(elements.count.value);
    state.page = 1;
    render();
  });

  const refreshOverlay = () => {
    state.overlay.individual.color = elements.individualColor.value;
    state.overlay.group.color = elements.groupColor.value;
    render();
  };

  elements.individualColor.addEventListener("input", refreshOverlay);
  elements.groupColor.addEventListener("input", refreshOverlay);
};

const enableMultiSelectToggle = (select) => {
  select.addEventListener("mousedown", (event) => {
    const option = event.target;
    if (option && option.tagName === "OPTION") {
      event.preventDefault();
      option.selected = !option.selected;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
};

const loadMetadata = async () => {
  const response = await fetch(METADATA_URL);
  if (!response.ok) {
    throw new Error("Failed to load metadata");
  }
  const data = await response.json();
  return data.images || [];
};

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgbaFromHex = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  const safeAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const getAnnotationStyle = (className) => {
  const name = String(className || "").toLowerCase();
  const config = name.includes("group")
    ? state.overlay.group
    : state.overlay.individual;
  const strokeAlpha = 0.95;
  const fillAlpha = 0.28;
  return {
    stroke: rgbaFromHex(config.color, strokeAlpha),
    fill: rgbaFromHex(config.color, fillAlpha),
  };
};

const drawOverlay = (item, canvas, width, height) => {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, width / 700);

  item.annotations.forEach((annotation) => {
    const points = annotation.segmentation;
    if (!points || points.length < 6) {
      return;
    }
    const { stroke, fill } = getAnnotationStyle(annotation.class);
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i] * (width / item.width);
      const y = points[i + 1] * (height / item.height);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
};

const imageLoaded = (img) =>
  new Promise((resolve, reject) => {
    if (img.complete && img.naturalWidth) {
      resolve(img);
      return;
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

const createCard = async (item) => {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h3");
  title.className = "card__title";
  title.textContent = item.file_name;

  const meta = document.createElement("p");
  meta.className = "card__meta";
  meta.textContent = `Size ${item.width}x${item.height}px · ${item.cm_resolution}cm · ${item.scene_type}`;

  const compare = document.createElement("div");
  compare.className = "compare";

  const baseImg = document.createElement("img");
  baseImg.alt = `${item.file_name} original`;
  baseImg.src = `${IMAGES_BASE}/${toPngName(item.file_name)}`;

  const overlayWrap = document.createElement("div");
  overlayWrap.className = "compare__overlay";

  const overlayCanvas = document.createElement("canvas");

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.value = "50";
  slider.className = "compare__slider";

  const label = document.createElement("div");
  label.className = "compare__label";
  label.textContent = "Overlay";

  const loading = document.createElement("div");
  loading.className = "compare__loading";
  loading.textContent = "Rendering overlay...";

  slider.addEventListener("input", () => {
    compare.style.setProperty("--reveal", `${slider.value}%`);
  });
  compare.style.setProperty("--reveal", `${slider.value}%`);

  overlayWrap.appendChild(overlayCanvas);
  compare.appendChild(baseImg);
  compare.appendChild(overlayWrap);
  compare.appendChild(slider);
  compare.appendChild(label);
  compare.appendChild(loading);

  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(compare);

  try {
    await imageLoaded(baseImg);
    const renderOverlay = () => {
      const imgRect = baseImg.getBoundingClientRect();
      const compareRect = compare.getBoundingClientRect();
      const width = Math.round(imgRect.width);
      const height = Math.round(imgRect.height);
      if (!width || !height) {
        return;
      }
      const offsetX = imgRect.left - compareRect.left;
      const offsetY = imgRect.top - compareRect.top;
      overlayCanvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      drawOverlay(item, overlayCanvas, width, height);
    };

    renderOverlay();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(renderOverlay);
      observer.observe(baseImg);
    } else {
      window.addEventListener("resize", renderOverlay);
    }
    loading.remove();
  } catch (error) {
    loading.textContent = "Overlay failed to render";
  }

  return card;
};

const render = async () => {
  const startIndex = (state.page - 1) * state.perPage;
  const pageItems = state.filtered.slice(startIndex, startIndex + state.perPage);
  elements.cards.innerHTML = "";
  elements.emptyState.hidden = pageItems.length !== 0;

  elements.resultCount.textContent = `${state.filtered.length} images`;
  elements.pageInfo.textContent = `Page ${state.page}`;

  for (const item of pageItems) {
    const card = await createCard(item);
    elements.cards.appendChild(card);
  }
};

const init = async () => {
  setupControls();
  try {
    state.images = await loadMetadata();
  } catch (error) {
    elements.emptyState.hidden = false;
    elements.emptyState.textContent = "Failed to load metadata.";
    return;
  }

  const resolutions = Array.from(
    new Set(state.images.map((item) => item.cm_resolution))
  ).sort((a, b) => a - b);
  const scenes = Array.from(new Set(state.images.map((item) => item.scene_type))).sort();

  populateSelect(elements.resolution, resolutions);
  populateSelect(elements.scene, scenes);
  enableMultiSelectToggle(elements.resolution);
  enableMultiSelectToggle(elements.scene);

  state.filtered = [...state.images];
  render();
};

init();
