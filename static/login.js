const API_BASE = "http://127.0.0.1:8000";
const notificationEl = document.getElementById("notification");
let toastTimer=null;
function toast(msg,type="success",ms=2200){
  notificationEl.textContent = msg;
  notificationEl.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>notificationEl.classList.remove("show"), ms);
}
async function login(email,password){
  const res = await fetch(`${API_BASE}/auth/login`,{
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password })
  });
  if(!res.ok){ toast(await res.text()||"Login failed","error"); return; }
  const data = await res.json();
  sessionStorage.setItem("jwt", data.access_token);
  window.location = "/";
}
async function register(email,password){
  const res = await fetch(`${API_BASE}/auth/register`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ email, password })
  });
  if(!res.ok){ toast(await res.text()||"Registration failed","error"); return; }
  toast("Registered. Signing in…"); await login(email,password);
}
document.getElementById("loginBtn").onclick = ()=>{
  const e = document.getElementById("loginEmail").value.trim();
  const p = document.getElementById("loginPassword").value;
  if(!e||!p) return toast("Email and password required","error");
  login(e,p);
};
document.getElementById("registerBtn").onclick = ()=>{
  const e = document.getElementById("loginEmail").value.trim();
  const p = document.getElementById("loginPassword").value;
  if(!e||!p) return toast("Email and password required","error");
  register(e,p);
};
