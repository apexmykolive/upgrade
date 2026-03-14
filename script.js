const UPGRADE_RATES = Object.freeze({
  low: Object.freeze({
    normal: Object.freeze({
      1: 100,
      2: 100,
      3: 80,
      4: 70,
      5: 40,
      6: 8,
      7: 2.5
    }),
    trina: Object.freeze({
      1: 100,
      2: 100,
      3: 100,
      4: 85,
      5: 60,
      6: 17.5,
      7: 10
    })
  }),
  middle: Object.freeze({
    normal: Object.freeze({
      1: 100,
      2: 100,
      3: 80,
      4: 60,
      5: 40,
      6: 8,
      7: 3,
      8: 0
    }),
    trina: Object.freeze({
      1: 100,
      2: 100,
      3: 100,
      4: 80,
      5: 55,
      6: 15,
      7: 5,
      8: 0
    })
  }),
  high: Object.freeze({
    normal: Object.freeze({
      1: 100,
      2: 100,
      3: 75,
      4: 55,
      5: 30,
      6: 2.75,
      7: 0
    }),
    trina: Object.freeze({
      1: 100,
      2: 100,
      3: 100,
      4: 75,
      5: 42,
      6: 4.5,
      7: 0
    })
  })
});

const CLASS_LABELS = Object.freeze({
  low: "Low Class",
  middle: "Middle Class",
  high: "High Class"
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

function getClassLabel(itemClass) {
  return CLASS_LABELS[itemClass] || "High Class";
}

function formatPercent(value) {
  if (value >= 10) return value.toFixed(1).replace(".0", "");
  if (value >= 1) return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function getRateTable(itemClass, hasTrina) {
  const classRates = UPGRADE_RATES[itemClass] || UPGRADE_RATES.high;
  return hasTrina ? classRates.trina : classRates.normal;
}

function getBaseRate(item, hasTrina) {
  const table = getRateTable(item.itemClass, hasTrina);
  return table[item.level] ?? 0;
}

function getFinalRate(item, hasTrina) {
  return getBaseRate(item, hasTrina);
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
  el.title = `${item.name} +${item.level} | ${getClassLabel(item.itemClass)}`;
  return el;
}

function createLevelTag(level) {
  const tag = document.createElement("div");
  tag.className = "item-level-tag";
  tag.textContent = `+${level}`;
  return tag;
}

function createClassTag(itemClass) {
  const tag = document.createElement("div");
  tag.className = `item-class-tag item-class-tag--${itemClass}`;
  tag.textContent = getClassLabel(itemClass);
  return tag;
}

/* --- DEVAM EDEN KOD AYNI --- */
/* ÖNEMLİ DEĞİŞİKLİK: inventory kısmında class etiketi kaldırıldı */

