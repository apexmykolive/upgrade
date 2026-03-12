const UPGRADE_RATES = Object.freeze({
  1: 100,
  2: 100,
  3: 80,
  4: 70,
  5: 50,
  6: 35,
  7: 10,
  8: 3,
  9: 0.5
});

const INVENTORY_SIZE = 28;

const inventoryItems = [];
let nextInventoryUid = 1;

const state = {
  selectedSearchItem: null,
  selectedInventoryItemUid: null,
  forgeInputUid: null,
  hasBus: false,
  hasTrina: false,
  outputPreviewItem: null,
  isRolling: false
};

const itemSearchInput = document.getElementById("itemSearchInput");
const searchResults = document.getElementById("searchResults");
const previewEmpty = document.getElementById("previewEmpty");
const previewContent = document.getElementById("previewContent");
const previewIcon = document.getElementById("previewIcon");
const previewName = document.getElementById("previewName");
const addToInventoryBtn = document.getElementById("addToInventoryBtn");

const inventoryGrid = document.getElementById("inventoryGrid");
const inputItemSlot = document.getElementById("inputItemSlot");
const busSlot = document.getElementById("busSlot");
const trinaSlot = document.getElementById("trinaSlot");
const outputItemSlot = document.getElementById("outputItemSlot");

const placeBusBtn = document.getElementById("placeBusBtn");
const placeTrinaBtn = document.getElementById("placeTrinaBtn");
const upgradeBtn = document.getElementById("upgradeBtn");
const clearForgeBtn = document.getElementById("clearForgeBtn");

const statusText = document.getElementById("statusText");
const rateText = document.getElementById("rateText");

const successEffect = document.getElementById("successEffect");
const failEffect = document.getElementById("failEffect");

function setStatus(text) {
  statusText.textContent = text;
}

function setRate(text) {
  rateText.textContent = text;
}

function formatPercent(value) {
  if (value >= 10) return value.toFixed(1).replace(".0", "");
  if (value >= 1) return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function getBaseRate(level) {
  return UPGRADE_RATES[level] ?? 0;
}

function getFinalRate(level, hasTrina) {
  const base = getBaseRate(level);
  return hasTrina ? base * 1.05 : base;
}

function rollSuccess(rate) {
  return Math.random() * 100 < rate;
}

function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function createSlotIcon(iconPath, title, large = false) {
  const el = document.createElement("div");
  el.className = `slot-item-icon${large ? " slot-item-icon--large" : ""}`;
  el.style.backgroundImage = `url("${iconPath}")`;
  el.title = title;
  return el;
}

function createInventoryIcon(item, disabled = false) {
  const el = document.createElement("div");
  el.className = `inventory-item${disabled ? " is-disabled" : ""}`;
  el.style.backgroundImage = `url("${item.icon}")`;
  el.title = `${item.name} +${item.level}`;
  return el;
}

function createLevelTag(level) {
  const tag = document.createElement("div");
  tag.className = "item-level-tag";
  tag.textContent = `+${level}`;
  return tag;
}

function playEffect(type) {
  const target = type === "success" ? successEffect : failEffect;
  target.classList.remove("is-playing");
  void target.offsetWidth;
  target.classList.add("is-playing");
}

function findInventoryItem(uid) {
  return inventoryItems.find(item => item.uid === uid) || null;
}

function getForgeInputItem() {
  return findInventoryItem(state.forgeInputUid);
}

function hasEmptyInventorySlot() {
  return inventoryItems.length < INVENTORY_SIZE;
}

function pushToInventory(baseItem, level = 1) {
  if (!hasEmptyInventorySlot()) {
    return false;
  }

  inventoryItems.push({
    uid: `inv_${nextInventoryUid++}`,
    itemId: baseItem.id,
    name: baseItem.name,
    icon: baseItem.icon,
    maxUpgrade: baseItem.maxUpgrade ?? 10,
    level
  });

  return true;
}

function removeInventoryItem(uid) {
  const index = inventoryItems.findIndex(item => item.uid === uid);
  if (index !== -1) {
    inventoryItems.splice(index, 1);
  }
}

function renderSearchResults(filterText = "") {
  clearElement(searchResults);

  const query = filterText.trim().toLowerCase();
  const filtered = ITEM_DATABASE.filter(item =>
    item.name.toLowerCase().includes(query)
  );

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "search-result-item";
    empty.textContent = "Sonuç bulunamadı.";
    searchResults.appendChild(empty);
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement("div");
    row.className = "search-result-item";
    row.textContent = item.name;

    row.addEventListener("click", () => {
      state.selectedSearchItem = item;
      renderPreview();
      setStatus(`${item.name} seçildi. İstersen envantere +1 olarak ekle.`);
    });

    searchResults.appendChild(row);
  });
}

function renderPreview() {
  if (!state.selectedSearchItem) {
    previewEmpty.classList.remove("hidden");
    previewContent.classList.add("hidden");
    return;
  }

  previewEmpty.classList.add("hidden");
  previewContent.classList.remove("hidden");

  previewIcon.style.backgroundImage = `url("${state.selectedSearchItem.icon}")`;
  previewName.textContent = state.selectedSearchItem.name;
}

function renderInventory() {
  clearElement(inventoryGrid);

  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const slot = document.createElement("div");
    slot.className = "inventory-slot";

    const item = inventoryItems[i];

    if (item) {
      if (state.selectedInventoryItemUid === item.uid) {
        slot.classList.add("is-selected");
      }

      const disabled = state.forgeInputUid === item.uid;
      const icon = createInventoryIcon(item, disabled);

      icon.addEventListener("click", () => {
        if (state.isRolling) return;
        if (state.outputPreviewItem) {
          setStatus("Çıkış slotundaki işlem tamamlanmadan yeni item seçemezsin.");
          return;
        }

        if (state.forgeInputUid === item.uid) {
          setStatus("Bu item zaten giriş slotunda.");
          return;
        }

        state.selectedInventoryItemUid = item.uid;
        state.forgeInputUid = item.uid;
        state.outputPreviewItem = null;
        state.hasBus = false;
        state.hasTrina = false;

        renderAll();
        setStatus(`${item.name} +${item.level} giriş slotuna yerleştirildi.`);
      });

      slot.appendChild(icon);
      slot.appendChild(createLevelTag(item.level));
    }

    inventoryGrid.appendChild(slot);
  }
}

function renderForgeSlots() {
  clearElement(inputItemSlot);
  clearElement(busSlot);
  clearElement(trinaSlot);
  clearElement(outputItemSlot);

  const forgeItem = getForgeInputItem();

  if (forgeItem) {
    inputItemSlot.appendChild(
      createSlotIcon(forgeItem.icon, `${forgeItem.name} +${forgeItem.level}`, true)
    );
  }

  if (state.hasBus) {
    busSlot.appendChild(
      createSlotIcon("img/itemicon/bus.png", "Blessed Upgrade Scroll")
    );
  }

  if (state.hasTrina) {
    trinaSlot.appendChild(
      createSlotIcon("img/itemicon/trina.png", "Trina's Piece")
    );
  }

  if (state.outputPreviewItem) {
    outputItemSlot.appendChild(
      createSlotIcon(
        state.outputPreviewItem.icon,
        `${state.outputPreviewItem.name} +${state.outputPreviewItem.level}`,
        true
      )
    );
  }

  updateRateText();
}

function updateRateText() {
  const item = getForgeInputItem();

  if (!item) {
    setRate("Başarı oranı: -");
    return;
  }

  const rate = getFinalRate(item.level, state.hasTrina);

  if (rate <= 0 || item.level >= item.maxUpgrade) {
    setRate("Başarı oranı: son seviye");
    return;
  }

  setRate(`+${item.level} → +${item.level + 1} başarı oranı: %${formatPercent(rate)}`);
}

function renderAll() {
  renderPreview();
  renderInventory();
  renderForgeSlots();
}

function handleAddToInventory() {
  if (!state.selectedSearchItem) {
    setStatus("Önce aramadan bir item seç.");
    return;
  }

  const ok = pushToInventory(state.selectedSearchItem, 1);

  if (!ok) {
    setStatus("Envanter dolu.");
    return;
  }

  renderInventory();
  setStatus(`${state.selectedSearchItem.name} +1 envantere eklendi.`);
}

function handlePlaceBus() {
  if (state.isRolling) return;

  const item = getForgeInputItem();

  if (!item) {
    setStatus("Önce giriş slotuna bir item koy.");
    return;
  }

  state.hasBus = true;
  renderForgeSlots();
  setStatus("BUS yerleştirildi.");
}

function handlePlaceTrina() {
  if (state.isRolling) return;

  const item = getForgeInputItem();

  if (!item) {
    setStatus("Önce giriş slotuna bir item koy.");
    return;
  }

  state.hasTrina = true;
  renderForgeSlots();
  setStatus("Trina yerleştirildi.");
}

function handleClearForge() {
  if (state.isRolling) return;

  state.selectedInventoryItemUid = null;
  state.forgeInputUid = null;
  state.hasBus = false;
  state.hasTrina = false;
  state.outputPreviewItem = null;

  renderAll();
  setStatus("Anvil temizlendi.");
}

function setButtonsDisabled(disabled) {
  placeBusBtn.disabled = disabled;
  placeTrinaBtn.disabled = disabled;
  upgradeBtn.disabled = disabled;
  clearForgeBtn.disabled = disabled;
  addToInventoryBtn.disabled = disabled;
}

function handleUpgrade() {
  if (state.isRolling) return;

  const inputItem = getForgeInputItem();

  if (!inputItem) {
    setStatus("Önce giriş slotuna bir item koy.");
    return;
  }

  if (!state.hasBus) {
    setStatus("Upgrade için BUS gerekli.");
    return;
  }

  if (inputItem.level >= inputItem.maxUpgrade) {
    setStatus("Bu item daha fazla upgrade edilemez.");
    return;
  }

  const oldLevel = inputItem.level;
  const chance = getFinalRate(oldLevel, state.hasTrina);

  state.isRolling = true;
  setButtonsDisabled(true);
  setStatus(`${inputItem.name} +${oldLevel} upgrade ediliyor...`);

  setTimeout(() => {
    const success = rollSuccess(chance);

    if (success) {
      const resultItem = {
        ...inputItem,
        level: oldLevel + 1
      };

      removeInventoryItem(inputItem.uid);

      state.forgeInputUid = null;
      state.selectedInventoryItemUid = null;
      state.hasBus = false;
      state.hasTrina = false;
      state.outputPreviewItem = resultItem;

      playEffect("success");
      renderAll();
      setStatus(
        `${resultItem.name} +${oldLevel} → +${resultItem.level} başarılı. Çıkış slotunda gösteriliyor.`
      );

      setTimeout(() => {
        pushToInventory(resultItem, resultItem.level);
        state.outputPreviewItem = null;
        renderAll();
        setStatus(`${resultItem.name} +${resultItem.level} envantere düştü.`);
        state.isRolling = false;
        setButtonsDisabled(false);
      }, 1200);

      return;
    }

    removeInventoryItem(inputItem.uid);

    state.forgeInputUid = null;
    state.selectedInventoryItemUid = null;
    state.hasBus = false;
    state.hasTrina = false;
    state.outputPreviewItem = null;

    playEffect("fail");
    renderAll();
    setStatus(
      `${inputItem.name} +${oldLevel} yandı. Item kayboldu. Oran: %${formatPercent(chance)}`
    );

    state.isRolling = false;
    setButtonsDisabled(false);
  }, 900);
}

function seedInitialItems() {
  const starters = ITEM_DATABASE.slice(0, 6);
  starters.forEach(item => pushToInventory(item, 1));
}

itemSearchInput.addEventListener("input", e => {
  renderSearchResults(e.target.value);
});

addToInventoryBtn.addEventListener("click", handleAddToInventory);
placeBusBtn.addEventListener("click", handlePlaceBus);
placeTrinaBtn.addEventListener("click", handlePlaceTrina);
upgradeBtn.addEventListener("click", handleUpgrade);
clearForgeBtn.addEventListener("click", handleClearForge);

seedInitialItems();
renderSearchResults("");
renderAll();
setStatus("Bir item seçip envantere ekle.");
