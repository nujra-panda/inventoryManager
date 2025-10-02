// static/script.js

const API_BASE = "inventory-backend-production-2a33.up.railway.app";
const baseURL = `${API_BASE}/products`;

// Redirect to login if no token
if (!sessionStorage.getItem("jwt")) {
  window.location = "/login";
}

// Toasts
const notificationEl = document.getElementById("notification");
let toastTimer = null;
function showNotification(msg, type = "success", ms = 2200) {
  if (!notificationEl) return;
  notificationEl.textContent = msg;
  notificationEl.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => notificationEl.classList.remove("show"), ms);
}

// Auth
let token = null;
function fmt(dt){ try { return new Date(dt).toLocaleString(); } catch { return dt || "—"; } }
function setAuthStatus(signedIn){
  const el = document.getElementById("authStatus");
  if (!el) return;
  el.textContent = signedIn ? "Signed in" : "Signed out";
  el.classList.toggle("signed-in", signedIn);
  el.classList.toggle("signed-out", !signedIn);
}
function saveToken(t){
  token = t || null;
  if (t) sessionStorage.setItem("jwt", t);
  else sessionStorage.removeItem("jwt");
  setAuthStatus(!!t);
}
function loadToken(){
  const t = sessionStorage.getItem("jwt");
  if (t) { token = t; setAuthStatus(true); }
}
function logout(){
  saveToken(null);
  showNotification("Logged out");
  setTimeout(()=> window.location = "/login", 400);
}
function authHeaders(){ 
  return token ? { 
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  } : {}; 
}
function requireAuth(){ 
  if (!token){ 
    showNotification("Please login first","error"); 
    return false; 
  } 
  return true; 
}

// Sample data (external APIs)
async function fetchPokemonSample(n=10){
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${n}`);
  if (!res.ok) throw new Error("External API error (PokéAPI)");
  const data = await res.json();
  return data.results.map((p,i)=> ({ name: `Pkmn: ${p.name}`, stock: 5 + i }));
}
async function fetchRickMortySample(n=10){
  const res = await fetch(`https://rickandmortyapi.com/api/character?limit=${n}`);
  if (!res.ok) throw new Error("External API error (Rick and Morty)");
  const data = await res.json();
  const chars = Array.isArray(data.results) ? data.results : [];
  if (chars.length === 0) throw new Error("No items found to import");
  return chars.slice(0,n).map((c,i)=> ({ name: `Char: ${c.name || "Unknown"}`, stock: 3 + (i % 7) }));
}
async function seedSample(){
  const sel = document.getElementById("sampleSource");
  const spinner = document.getElementById("sampleSpinner");
  if (!sel || !spinner) return;

  spinner.style.display = "";
  try{
    let items = sel.value === "pokemon" ? await fetchPokemonSample(10) : await fetchRickMortySample(10);
    if (!Array.isArray(items) || items.length === 0) throw new Error("No items found to import");

    for (const item of items) {
      const res = await fetch(`${API_BASE}/products`, {
        method:"POST",
        headers: authHeaders(),
        body: JSON.stringify(item)
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Failed to add: ${item.name} — ${msg || res.status}`);
      }
    }
    showNotification(`Seeded ${items.length} items`);
    getProducts();
  }catch(err){
    showNotification(err.message || "Failed to seed sample data", "error");
  }finally{
    spinner.style.display = "none";
  }
}

// Empty state
function renderEmptyState(show){
  const empty = document.getElementById("emptyState");
  const list = document.getElementById("productList");
  const sk = document.getElementById("productSkeleton");
  if (!empty || !list || !sk) return;
  if (show){
    empty.style.display = "";
    list.style.display = "none";
    sk.style.display = "none";
  } else {
    empty.style.display = "none";
    list.style.display = "";
  }
}
function addSampleProduct(){
  const nameEl = document.getElementById("productName");
  const stockEl = document.getElementById("productStock");
  if (!nameEl || !stockEl) return;
  nameEl.value = "Sample Item";
  stockEl.value = "5";
  addProduct();
}

// Loading skeletons
function showSkeletons(count=4){
  const sk = document.getElementById("productSkeleton");
  const list = document.getElementById("productList");
  const empty = document.getElementById("emptyState");
  if (!sk || !list || !empty) return;
  list.style.display = "none";
  empty.style.display = "none";
  sk.innerHTML = "";
  for (let i=0;i<count;i++){
    const li = document.createElement("li");
    li.className = "skeleton";
    sk.appendChild(li);
  }
  sk.style.display = "";
}
function hideSkeletons(){
  const sk = document.getElementById("productSkeleton");
  if (sk){ sk.style.display = "none"; sk.innerHTML = ""; }
}

// Expand/collapse state
const openDetails = new Map();
function toggleDetails(id, btn){
  const el = document.getElementById(`details-${id}`);
  if (!el) return;
  const open = !el.classList.contains("open");
  el.classList.toggle("open", open);
  openDetails.set(id, open);
  if (btn) btn.textContent = open ? "▾" : "▸";
}

// Confirm delete modal (simple)
function confirmDelete(id, name){
  const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
  if (ok) deleteProduct(id);
}

// API
async function getProducts(){
  try{
    showSkeletons(4);
    const res = await fetch(baseURL, { 
      headers: authHeaders() 
    });
    
    if (res.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return;
    }
    
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
    const data = await res.json();

    const list = document.getElementById("productList");
    if (!list) return;
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0){
      hideSkeletons();
      renderEmptyState(true);
      return;
    }
    renderEmptyState(false);

    data.forEach((product) => {
      const li = document.createElement("li");
      li.className = "item";
      const isLow = product.stock <= 5;
      const isOpen = openDetails.get(product.id) === true;

      li.innerHTML = `
        <div class="item-left">
          <button class="disclosure" onclick="toggleDetails(${product.id}, this)">${isOpen ? "▾" : "▸"}</button>
          <span class="badge">#${product.id}</span>
          <strong>${product.name}</strong>
          <span class="badge ${isLow ? "low" : ""}">Stock: ${product.stock}</span>
        </div>
        <div class="controls">
          <button class="icon inc" onclick="updateStock(${product.id}, ${product.version}, 1)">+1</button>
          <button class="icon dec" onclick="updateStock(${product.id}, ${product.version}, -1)">-1</button>
          <button class="icon del" onclick="confirmDelete(${product.id}, '${String(product.name).replace(/'/g, "\\'")}')">Delete</button>
        </div>
        <div class="details ${isOpen ? "open" : ""}" id="details-${product.id}">
          <div class="details-grid">
            <div><span class="hint">Created</span><div>${fmt(product.created_at)}</div></div>
            <div><span class="hint">Updated</span><div>${fmt(product.updated_at)}</div></div>
            <div><span class="hint">Version</span><div>${product.version}</div></div>
          </div>
        </div>
      `;
      list.appendChild(li);
    });
  }catch(err){
    showNotification(err.message || "Failed to fetch products","error");
  }finally{
    hideSkeletons();
  }
}

async function addProduct(){
  if (!requireAuth()) return;
  const nameEl = document.getElementById("productName");
  const stockEl = document.getElementById("productStock");
  const name = nameEl.value.trim();
  const stock = parseInt(stockEl.value, 10);
  if (!name) return showNotification("Product name required","error");
  if (Number.isNaN(stock)) return showNotification("Stock must be a number","error");

  try{
    const res = await fetch(baseURL, {
      method:"POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, stock }),
    });
    if (!res.ok){ 
      const errorText = await res.text();
      throw new Error(errorText || "Failed to add product"); 
    }
    nameEl.value = ""; stockEl.value = "";
    showNotification("Product added"); 
    getProducts();
  }catch(err){ 
    showNotification(err.message || "Failed to add product","error"); 
  }
}

async function updateStock(id, version, delta){
  if (!requireAuth()) return;
  try{
    const res = await fetch(`${baseURL}/${id}`, {
      method:"PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ stock: delta, version }),
    });
    
    if (res.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return;
    }
    
    if (res.status === 409){ 
      showNotification("Version conflict. Refreshing…","error"); 
      getProducts(); 
      return; 
    }
    if (!res.ok){ 
      const errorText = await res.text();
      throw new Error(errorText || "Failed to update stock"); 
    }
    showNotification(delta > 0 ? "Stock increased" : "Stock decreased");
    getProducts();
  }catch(err){ 
    showNotification(err.message || "Failed to update stock","error"); 
  }
}

async function deleteProduct(id){
  if (!requireAuth()) return;
  try{
    const res = await fetch(`${baseURL}/${id}`, { 
      method:"DELETE", 
      headers: authHeaders() 
    });
    
    if (res.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return;
    }
    
    if (!res.ok){ 
      const errorText = await res.text();
      throw new Error(errorText || "Failed to delete product"); 
    }
    showNotification("Product deleted"); 
    getProducts();
  }catch(err){ 
    showNotification(err.message || "Failed to delete","error"); 
  }
}

// Export CSV
async function exportCSV() {
  if (!requireAuth()) return;
  try {
    const res = await fetch(baseURL, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch products for export");
    const products = await res.json();
    
    const headers = ['ID', 'Name', 'Stock', 'Version', 'Created', 'Updated'];
    const csvData = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.stock,
      p.version,
      p.created_at,
      p.updated_at
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("CSV exported successfully");
  } catch (err) {
    showNotification(err.message || "Failed to export CSV", "error");
  }
}

// Boot
loadToken();
getProducts();