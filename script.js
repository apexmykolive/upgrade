const UPGRADE_RATES = Object.freeze({
  low:{
    normal:{1:100,2:100,3:80,4:70,5:40,6:8,7:2.5},
    trina:{1:100,2:100,3:100,4:85,5:60,6:17.5,7:10}
  },
  middle:{
    normal:{1:100,2:100,3:80,4:60,5:40,6:8,7:3,8:0},
    trina:{1:100,2:100,3:100,4:80,5:55,6:15,7:5,8:0}
  },
  high:{
    normal:{1:100,2:100,3:75,4:55,5:30,6:2.75,7:0},
    trina:{1:100,2:100,3:100,4:75,5:42,6:4.5,7:0}
  }
});

const CLASS_LABELS={
  low:"Low Class",
  middle:"Middle Class",
  high:"High Class"
};

const INVENTORY_SIZE=28;
const inventoryItems=[];
let nextInventoryUid=1;

const state={
  selectedSearchItem:null,
  forgeInputUid:null,
  hasBus:false,
  hasTrina:false
};

const itemSearchInput=document.getElementById("itemSearchInput");
const searchResults=document.getElementById("searchResults");
const inventoryGrid=document.getElementById("inventoryGrid");
const inputItemSlot=document.getElementById("inputItemSlot");

function getClassLabel(c){
  return CLASS_LABELS[c]||"High Class";
}

function createInventoryIcon(item){
  const el=document.createElement("div");
  el.className="inventory-item";
  el.style.backgroundImage=`url("${item.icon}")`;
  return el;
}

function createLevelTag(level){
  const tag=document.createElement("div");
  tag.className="item-level-tag";
  tag.textContent=`+${level}`;
  return tag;
}

function clearElement(el){
  while(el.firstChild) el.removeChild(el.firstChild);
}

/* ITEM ARAMA */

function renderSearchResults(filter=""){
  clearElement(searchResults);

  const query=filter.toLowerCase();

  const filtered=ITEM_DATABASE.filter(i =>
    i.name.toLowerCase().includes(query)
  );

  filtered.forEach(item=>{
    const row=document.createElement("div");
    row.className="search-result-item";

    const name=document.createElement("div");
    name.textContent=item.name;

    const meta=document.createElement("div");
    meta.textContent=`${getClassLabel(item.itemClass)} • MAX +${item.maxUpgrade}`;

    row.appendChild(name);
    row.appendChild(meta);

    row.onclick=()=>{
      state.selectedSearchItem=item;
      addItemToInventory(item);
    };

    searchResults.appendChild(row);
  });
}

/* ENVANTER */

function addItemToInventory(base){
  if(inventoryItems.length>=INVENTORY_SIZE) return;

  inventoryItems.push({
    uid:"inv_"+nextInventoryUid++,
    name:base.name,
    icon:base.icon,
    itemClass:base.itemClass,
    level:1,
    maxUpgrade:base.maxUpgrade
  });

  renderInventory();
}

function renderInventory(){
  clearElement(inventoryGrid);

  inventoryItems.forEach(item=>{
    const slot=document.createElement("div");
    slot.className="inventory-slot";

    const icon=createInventoryIcon(item);

    icon.onclick=()=>{
      state.forgeInputUid=item.uid;
      renderForge();
    };

    slot.appendChild(icon);
    slot.appendChild(createLevelTag(item.level));

    /* CLASS ETİKETİ BİLEREK EKLENMEDİ */

    inventoryGrid.appendChild(slot);
  });
}

/* ANVIL */

function renderForge(){
  clearElement(inputItemSlot);

  const item=inventoryItems.find(i=>i.uid===state.forgeInputUid);
  if(!item) return;

  const icon=document.createElement("div");
  icon.className="slot-item-icon";
  icon.style.backgroundImage=`url("${item.icon}")`;

  inputItemSlot.appendChild(icon);
}

/* INPUT */

itemSearchInput.addEventListener("input",e=>{
  renderSearchResults(e.target.value);
});

/* INIT */

renderSearchResults("");
renderInventory();
