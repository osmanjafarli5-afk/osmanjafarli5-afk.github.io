/* Maşın Elanları — istifadəçi girişi və saytdan elan yerləşdirmə.
   Firebase konfiqurasiyası doldurulmayıbsa, UI görünmür və sayt əvvəlki kimi işləyir. */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8qgiGWFLsJRyIJAQ61scw9qk4PjRD8yQ",
  authDomain: "mashinelanlari.firebaseapp.com",
  projectId: "mashinelanlari",
  storageBucket: "mashinelanlari.firebasestorage.app",
  messagingSenderId: "999601852875",
  appId: "1:999601852875:web:d8df12d037aa96609be64e"
};

const ADS_COLLECTION = "listings";

const CLOUDINARY = {
  cloud: "",        // Cloudinary cloud name
  preset: ""        // unsigned upload preset
};

function cfgReady() {
  return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}

/* ---------- UI skeleti ---------- */
function buildUi() {
  const head = document.querySelector(".btns");
  if (!head || document.getElementById("authBtn")) return;

  const btn = document.createElement("button");
  btn.className = "btn btn-ghost";
  btn.id = "authBtn";
  btn.textContent = "👤 Daxil ol";
  head.appendChild(btn);

  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";
  wrap.id = "authWrap";
  wrap.innerHTML = `
    <div class="auth-card" role="dialog" aria-modal="true">
      <button class="sup-x" id="authX" aria-label="Bağla">✕</button>
      <div class="auth-tabs">
        <button class="auth-tab on" data-tab="login">Daxil ol</button>
        <button class="auth-tab" data-tab="reg">Qeydiyyat</button>
      </div>
      <div id="authPane">
        <label class="auth-lbl">Email</label>
        <input id="authEmail" type="email" placeholder="ad@mail.com" autocomplete="email">
        <label class="auth-lbl">Şifrə</label>
        <input id="authPass" type="password" placeholder="••••••" autocomplete="current-password">
        <div class="auth-msg" id="authMsg"></div>
        <button class="btn btn-primary auth-go" id="authGo">Daxil ol</button>
        <div class="auth-alt"><a href="#" id="authReset">Şifrəmi unutdum</a></div>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const form = document.createElement("div");
  form.className = "auth-wrap";
  form.id = "adWrap";
  form.innerHTML = `
    <div class="auth-card wide" role="dialog" aria-modal="true">
      <button class="sup-x" id="adX" aria-label="Bağla">✕</button>
      <h3>🚗 Elan yerləşdir</h3>
      <p class="ad-sub">Doldurun — yoxlanıldıqdan sonra kanalda və saytda paylaşılır.</p>
      <div class="ad-grid">
        <div><label class="auth-lbl">Marka *</label><input id="adBrand" placeholder="Kia"></div>
        <div><label class="auth-lbl">Model *</label><input id="adModel" placeholder="Cerato"></div>
        <div><label class="auth-lbl">İl *</label><input id="adYear" type="number" placeholder="2018"></div>
        <div><label class="auth-lbl">Yürüş (km) *</label><input id="adKm" type="number" placeholder="90000"></div>
        <div><label class="auth-lbl">Qiymət (₼) *</label><input id="adPrice" type="number" placeholder="19000"></div>
        <div><label class="auth-lbl">Şəhər</label><input id="adCity" placeholder="Bakı"></div>
        <div><label class="auth-lbl">Telefon *</label><input id="adPhone" placeholder="+994 50 000 00 00"></div>
        <div><label class="auth-lbl">Telegram (username)</label><input id="adTg" placeholder="@username"></div>
        <div class="full"><label class="auth-lbl">Qeyd</label><input id="adNote" placeholder="Vuruğu yoxdur, ilk sahibindən..."></div>
      </div>
      <div class="auth-msg" id="adMsg"></div>
      <button class="btn btn-primary auth-go" id="adGo">Göndər</button>
      <p class="ad-sub" style="margin-top:10px">📷 Şəkilləri <a href="https://t.me/masin_elan_qebul_bot" target="_blank" rel="noopener">bota</a> göndərin — elana avtomatik əlavə olunacaq.</p>
    </div>`;
  document.body.appendChild(form);

  if (cfgReady()) {
    const fab = document.createElement("button");
    fab.id = "adFab";
    fab.className = "ad-fab";
    fab.textContent = "➕ Elan yerləşdir";
    document.body.appendChild(fab);
    fab.addEventListener("click", () => {
      if (!window.__user) { toggleWrap("authWrap", true); return; }
      toggleWrap("adWrap", true);
    });
  }

  btn.addEventListener("click", () => toggleWrap("authWrap", true));
  document.getElementById("authX").addEventListener("click", () => toggleWrap("authWrap", false));
  document.getElementById("adX").addEventListener("click", () => toggleWrap("adWrap", false));
  [wrap, form].forEach(w => w.addEventListener("click", e => {
    if (e.target === w) w.classList.remove("on");
  }));

  // "Elana bax" — qeydiyyat tələb et
  document.addEventListener("click", function (e) {
    const a = e.target.closest(".more");
    if (!a) return;
    if (window.__user) return;
    e.preventDefault();
    e.stopPropagation();
    toggleWrap("authWrap", true);
    const m = document.getElementById("authMsg");
    if (m) m.textContent = "Elana baxmaq üçün daxil olun və ya qeydiyyatdan keçin.";
    const t = document.querySelector('.auth-tab[data-tab="reg"]');
    if (t) t.click();
  }, true);
}

function toggleWrap(id, on) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("on", !!on);
}

/* ---------- Firebase ---------- */
let fb = null;

async function initFirebase() {
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  fb = {
    auth: authMod.getAuth(app),
    authMod,
    db: fsMod.getFirestore(app),
    fsMod
  };

  authMod.onAuthStateChanged(fb.auth, (u) => {
    window.__user = u;
    const b = document.getElementById("authBtn");
    if (b) b.textContent = u ? "👤 " + (u.email || "").split("@")[0] : "👤 Daxil ol";
    if (u) toggleWrap("authWrap", false);
  });

  document.getElementById("authGo").addEventListener("click", doAuth);
  document.getElementById("adGo").addEventListener("click", submitAd);
  document.getElementById("authReset").addEventListener("click", resetPass);
  document.querySelectorAll(".auth-tab").forEach(t =>
    t.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(x => x.classList.remove("on"));
      t.classList.add("on");
      document.getElementById("authGo").textContent =
        t.dataset.tab === "reg" ? "Qeydiyyatdan keç" : "Daxil ol";
      document.getElementById("authGo").dataset.mode = t.dataset.tab;
    }));
}

async function doAuth() {
  const mode = document.getElementById("authGo").dataset.mode || "login";
  const email = document.getElementById("authEmail").value.trim();
  const pass = document.getElementById("authPass").value;
  const msg = document.getElementById("authMsg");
  msg.textContent = "";
  try {
    if (mode === "reg") {
      const cred = await fb.authMod.createUserWithEmailAndPassword(fb.auth, email, pass);
      await fb.authMod.sendEmailVerification(fb.auth.currentUser).catch(() => {});
      try {
        await fb.fsMod.addDoc(fb.fsMod.collection(fb.db, "registrations"), {
          email, uid: cred.user.uid, createdAt: Date.now(), notified: false
        });
      } catch (err) { console.log("qeydiyyat qeydi yazilmadi", err); }
      msg.textContent = "✅ Qeydiyyat oldu — emailinizə təsdiq məktubu göndərildi.";
    } else {
      await fb.authMod.signInWithEmailAndPassword(fb.auth, email, pass);
    }
  } catch (e) {
    msg.textContent = "⚠️ " + (e.code === "auth/invalid-credential" ? "Email və ya şifrə yanlışdır"
      : e.code === "auth/email-already-in-use" ? "Bu email artıq qeydiyyatdadır"
      : e.code === "auth/weak-password" ? "Şifrə ən azı 6 simvol olmalıdır"
      : e.message);
  }
}

async function resetPass() {
  const email = document.getElementById("authEmail").value.trim();
  const msg = document.getElementById("authMsg");
  if (!email) { msg.textContent = "Əvvəlcə emaili yazın."; return; }
  try {
    await fb.authMod.sendPasswordResetEmail(fb.auth, email);
    msg.textContent = "✅ Bərpa linki emailinizə göndərildi.";
  } catch (e) {
    msg.textContent = "⚠️ " + e.message;
  }
}

async function uploadPhoto(file) {
  if (!CLOUDINARY.cloud || !CLOUDINARY.preset) return null;
  const bmp = await new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
  const max = 1280;
  const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(bmp.width * sc);
  cv.height = Math.round(bmp.height * sc);
  cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.82));
  const fd = new FormData();
  fd.append("file", blob, "photo.jpg");
  fd.append("upload_preset", CLOUDINARY.preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/image/upload`,
                          { method: "POST", body: fd });
  const data = await res.json();
  return data.secure_url || null;
}

async function submitAd() {
  const g = id => document.getElementById(id).value.trim();
  const msg = document.getElementById("adMsg");
  msg.textContent = "";
  const brand = g("adBrand"), model = g("adModel"), year = +g("adYear"),
        km = +g("adKm"), price = +g("adPrice"), phone = g("adPhone");
  if (!brand || !model || !year || !price || !phone) {
    msg.textContent = "⚠️ Marka, model, il, qiymət və telefon vacibdir.";
    return;
  }
  try {
    const photoUrl = "";
    await fb.fsMod.addDoc(fb.fsMod.collection(fb.db, ADS_COLLECTION), {
      brand, model, year, km, price,
      city: g("adCity"), phone, note: g("adNote"), tg: g("adTg").replace("@", ""),
      uid: window.__user ? window.__user.uid : null,
      email: window.__user ? window.__user.email : null,
      status: "pending",
      createdAt: Date.now()
    });
    msg.textContent = "✅ Elan göndərildi! Yoxlanıldıqdan sonra kanalda və saytda paylaşılacaq.";
    ["adBrand", "adModel", "adYear", "adKm", "adPrice", "adCity", "adNote", "adTg"].forEach(i => {
      const el = document.getElementById(i); if (el) el.value = "";
    });
    toggleWrap("adWrap", false);
  } catch (e) {
    msg.textContent = "⚠️ Göndərilmədi: " + e.message;
  }
}

/* ---------- start ---------- */
buildUi();
if (cfgReady()) {
  initFirebase().catch(() => {});
} else {
  // konfiqurasiya hələ yoxdur: pəncərə açılır, izahat göstərilir
  const go = document.getElementById("authGo");
  if (go) go.addEventListener("click", function () {
    document.getElementById("authMsg").innerHTML =
      "⏳ Qeydiyyat hazırlanır. Hazırda elanı " +
      '<a href="https://t.me/masin_elan_qebul_bot" target="_blank" rel="noopener">bota</a> göndərin.';
  });
}
