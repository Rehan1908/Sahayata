// Shared client helpers
export const api = {
  async get(path){
    const r = await fetch(path, { credentials: 'same-origin' });
    if(!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
    return r.json();
  },
  async post(path, body){
    const r = await fetch(path, { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'same-origin', body: JSON.stringify(body||{}) });
    const t = await r.text();
    try{ const j = JSON.parse(t); if(!r.ok || j.ok===false) throw new Error(j.error||t); return j; } catch{ if(!r.ok) throw new Error(`${r.status} ${t}`); return { raw: t }; }
  }
};

export async function ensureSession(){
  const key = 'sahayata.sid';
  let sid = localStorage.getItem(key);
  if(!sid){
    const res = await api.get('/api/session');
    sid = res.sessionId;
    localStorage.setItem(key, sid);
  }
  return sid;
}

export function getUserId(){
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id; // Return the actual user ID from auth
    }
  } catch (e) {
    console.error('Error getting user ID:', e);
  }
  return null;
}
