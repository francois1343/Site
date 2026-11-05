const currency = new Intl.NumberFormat('fr-BE',{style:'currency',currency:'EUR'});
const state = {items:[],family:'',price:'all',sort:'menu',loaded:false,staticCards:[]};
const $ = (selector,root=document) => root.querySelector(selector);
function node(tag,className,text) {
  const element=document.createElement(tag);
  if(className) element.className=className;
  if(text!==undefined) element.textContent=text;
  return element;
}
function addButton(item, drink=false) {
  const button=node('button',drink?'boisson-add-btn':'item-add-btn','+');
  button.type='button'; button.dataset.menuId=item.id; button.dataset.item=item.name;
  button.dataset.price=String(item.priceCents/100);
  button.setAttribute('aria-label','Ajouter '+item.name+' au panier');
  return button;
}
function pizzaCard(item) {
  const card=node('article','pizza-card'+(item.featured?' pizza-card--signature':''));
  card.dataset.price=String(item.priceCents/100);
  card.dataset.priceCents=String(item.priceCents);
  card.dataset.family=item.family||'';
  card.dataset.position=String(item.position);
  if(item.image) {
    const photo=node('img','pizza-photo'); photo.src=item.image; photo.alt='Pizza '+item.name; photo.loading='lazy';
    card.append(photo);
  }
  const content=node('div','pizza-card-content');
  if(item.featured) content.append(node('span','pizza-badge','Signature'));
  content.append(node('div','pizza-name',item.name));
  content.append(node('div','pizza-ingredients',item.description||''));
  const price=node('div','pizza-price',currency.format(item.priceCents/100));
  content.append(price);
  card.append(content,addButton(item));
  return card;
}
function menuItem(item) {
  const row=node('div','menu-item'); row.dataset.menuId=item.id;
  if(item.image) {
    const photo=node('img','menu-item-photo');photo.src=item.image;photo.alt=item.name;photo.loading='lazy';
    row.append(photo);
  }
  const details=node('div','item-details');
  details.append(node('span','item-name',item.name));
  if(item.description) details.append(node('span','item-description',item.description));
  const price=node('span','item-price',currency.format(item.priceCents/100));
  const dots=node('span','item-dots');
  row.append(details,dots,price,addButton(item));
  return row;
}
function drinkItem(item) {
  const tag=node('span','boisson-tag');
  if(item.image) {
    const photo=node('img','menu-item-photo');photo.src=item.image;photo.alt=item.name;photo.loading='lazy';
    tag.append(photo);
  }
  tag.append(node('span','boisson-name',item.name));
  tag.append(node('span','boisson-price',currency.format(item.priceCents/100)));
  tag.append(addButton(item,true));
  return tag;
}
function priceMatches(item) {
  if(state.price==='under12') return item.priceCents<1200;
  if(state.price==='12-13') return item.priceCents>=1200&&item.priceCents<1400;
  if(state.price==='14-15') return item.priceCents>=1400&&item.priceCents<1600;
  if(state.price==='16plus') return item.priceCents>=1600;
  return true;
}
function updatePizzas() {
  const grid=$('#pizzaGrid');
  if(!grid) return;
  if(!state.loaded) {
    if(!state.staticCards.length) {
      state.staticCards=Array.from(grid.querySelectorAll('.pizza-card'));
      state.staticCards.forEach((card,index)=>{
        card.dataset.position=String(index);
        card.dataset.priceCents=String(Math.round(Number(card.dataset.price)*100));
        card.dataset.family=index<20?'italiennes':'speciales';
      });
    }
    const rows=state.staticCards.filter(card=>(!state.family||card.dataset.family===state.family)&&priceMatches({priceCents:Number(card.dataset.priceCents)}));
    if(state.sort==='price-asc') rows.sort((a,b)=>Number(a.dataset.priceCents)-Number(b.dataset.priceCents)||Number(a.dataset.position)-Number(b.dataset.position));
    else if(state.sort==='price-desc') rows.sort((a,b)=>Number(b.dataset.priceCents)-Number(a.dataset.priceCents)||Number(a.dataset.position)-Number(b.dataset.position));
    else rows.sort((a,b)=>Number(a.dataset.position)-Number(b.dataset.position));
    grid.replaceChildren(...rows);
    const empty=$('#pizzaEmpty');
    if(empty) empty.hidden=rows.length>0;
    return;
  }
  const rows=state.items.filter(item=>(!state.family||item.family===state.family)&&priceMatches(item));
  if(state.sort==='price-asc') rows.sort((a,b)=>a.priceCents-b.priceCents||a.position-b.position);
  else if(state.sort==='price-desc') rows.sort((a,b)=>b.priceCents-a.priceCents||a.position-b.position);
  else rows.sort((a,b)=>a.position-b.position);
  grid.replaceChildren(...rows.map(pizzaCard));
  const empty=$('#pizzaEmpty');
  if(empty) empty.hidden=rows.length>0;
}
function renderCatalogue(data) {
  state.items=data.items||[];
  const byCategory=new Map();
  for(const item of state.items) if(item.active) {
    const rows=byCategory.get(item.category)||[]; rows.push(item); byCategory.set(item.category,rows);
  }
  for(const category of data.categories||[]) {
    const section=document.getElementById(category.id);
    if(!section) continue;
    const items=byCategory.get(category.id)||[];
    section.hidden=items.length===0;
    if(category.id==='pizzas') {
      state.items=items;
      updatePizzas();
      continue;
    }
    const container=category.id==='boissons'?$('.boissons-list',section):$('.menu-grid',section);
    if(container) container.replaceChildren(...items.map(item=>category.id==='boissons'?drinkItem(item):menuItem(item)));
  }
  document.dispatchEvent(new CustomEvent('lamouna:menu-loaded',{detail:{items:data.items||[]}}));
}
function setupPizzaFilters() {
  const familyBox=$('#pizzaFamilyFilters');
  familyBox?.addEventListener('click',event=>{
    const button=event.target.closest('[data-family-filter]'); if(!button) return;
    state.family=button.dataset.familyFilter;
    familyBox.querySelectorAll('[data-family-filter]').forEach(item=>item.classList.toggle('active',item===button));
    updatePizzas();
  });
  $('#pizzaPriceFilter')?.addEventListener('change',event=>{state.price=event.target.value;updatePizzas();});
  $('#pizzaSort')?.addEventListener('change',event=>{state.sort=event.target.value;updatePizzas();});
}
async function loadMenu() {
  setupPizzaFilters();
  try {
    const response=await fetch('/api/menu',{cache:'no-store',credentials:'same-origin'});
    if(!response.ok) throw new Error('Menu indisponible');
    const data=await response.json();
    if(data.schema!=='lamouna-menu/1'||!Array.isArray(data.items)) throw new Error('Menu invalide');
    state.loaded=true;
    renderCatalogue(data);
  } catch(error) {
    console.info('Le menu conserve son affichage de secours :',error.message);
    updatePizzas();
  }
}
document.addEventListener('DOMContentLoaded',loadMenu);
