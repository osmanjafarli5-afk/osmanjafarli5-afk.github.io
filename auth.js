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
        <div><label class="auth-lbl">Telegram *<span style="color:#d6336c">(mütləqdir)</span></label><input id="adTg" placeholder="@username" required><div style="font-size:11.5px;color:#7d8899;margin-top:4px">Elan linki bu Telegram hesabına göndəriləcək</div></div>
        <div class="full"><label class="auth-lbl">Qeyd</label><input id="adNote" placeholder="Vuruğu yoxdur, ilk sahibindən..."></div>
      </div>
      <div class="auth-msg" id="adMsg"></div>
      <button class="btn btn-primary auth-go" id="adGo">Göndər</button>
      <p class="ad-sub" style="margin-top:10px">📷 Şəkilləri <a href="https://t.me/masin_elan_qebul_bot" target="_blank" rel="noopener">bota</a> göndərin — elana avtomatik əlavə olunacaq.</p>
    </div>`;
  document.body.appendChild(form);

    // profil pəncərəsi (ad + mail)
  const prof = document.createElement("div");
  prof.className = "auth-wrap";
  prof.id = "profWrap";
  prof.innerHTML = `
    <div class="auth-card" role="dialog" aria-modal="true">
      <button class="sup-x" id="profX" aria-label="Bağla">✕</button>
      <div class="prof-head">
        <div class="prof-ava" id="profAva">👤</div>
        <div class="prof-info">
          <div class="prof-nameline">
            <span class="prof-name" id="profName">—</span>
            <button class="prof-edit" id="profEdit" title="Adı dəyiş">✏️</button>
          </div>
          <div class="prof-mail" id="profMail"></div>
        </div>
      </div>
      <div id="profEditBox" style="display:none;margin-top:16px">
        <label class="auth-lbl">Adınız</label>
        <input id="profInput" placeholder="Ad Soyad">
        <button class="btn btn-primary auth-go" id="profSave">Yadda saxla</button>
      </div>
      <button class="btn btn-ghost auth-go" id="profOut" style="margin-top:14px">Çıxış</button>
      <button class="btn btn-ghost auth-go" id="profDel"
              style="margin-top:8px;color:#d6336c;border-color:#f7c9d6">🗑 Hesabı sil</button>
      <div id="delBox" style="display:none;margin-top:12px;padding:13px 14px;border-radius:12px;
           background:#fff5f8;border:1px solid #f7c9d6;font-size:13px;line-height:1.5;color:#7a1f3d">
        <b>⚠️ Diqqət!</b> Hesabınız silinəcək və yaddaşda qalan hər şey
        (seçilmişlər, elanlar, mesajlar) silinə bilər. Bu əməliyyat geri qaytarılmır.
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-primary auth-go" id="delYes"
                  style="background:#d6336c;box-shadow:0 6px 16px rgba(214,51,108,.28)">Bəli, sil</button>
          <button class="btn btn-ghost auth-go" id="delNo">Ləğv et</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(prof);

  // email təsdiqi pəncərəsi
  const ver = document.createElement("div");
  ver.className = "auth-wrap";
  ver.id = "verWrap";
  ver.innerHTML = `
    <div class="auth-card" role="dialog" aria-modal="true">
      <button class="sup-x" id="verX" aria-label="Bağla">✕</button>
      <h3>📧 Emailinizi təsdiqləyin</h3>
      <p class="ad-sub">Qeydiyyat üçün göstərdiyiniz ünvana təsdiq linki göndərdik.
         Linkə basmadan elan yerləşdirmək və elanlara baxmaq mümkün deyil.</p>
      <div class="prof-mail" id="verMail" style="margin-bottom:14px"></div>
      <div class="auth-msg" id="verMsg"></div>
      <button class="btn btn-primary auth-go" id="verCheck">Təsdiqlədim ✓</button>
      <button class="btn btn-ghost auth-go" id="verResend" style="margin-top:10px">Linki yenidən göndər</button>
    </div>`;
  document.body.appendChild(ver);


  // promosyon pəncərəsi
  const promo = document.createElement("div");
  promo.className = "auth-wrap";
  promo.id = "promoWrap";
  promo.innerHTML = `
    <div class="auth-card wide" role="dialog" aria-modal="true">
      <button class="sup-x" id="promoX" aria-label="Bağla">✕</button>
      <h3>🚀 Elanı irəli çək</h3>
      <p class="ad-sub">Elanınız siyahının başında görünsün. Ödənişdən sonra elan dərhal yuxarı qalxır.</p>
      <div class="promoList">
        <button class="promoOpt" data-p="boost">
          <span class="po-ico">⚡</span>
          <span class="po-txt"><b>İrəli çək</b><small>3 gün öndə</small></span>
          <span class="po-price">3 ₼</span>
        </button>
        <button class="promoOpt" data-p="vip">
          <span class="po-ico">⭐</span>
          <span class="po-txt"><b>VIP</b><small>5 gün · VIP nişanı</small></span>
          <span class="po-price">5 ₼</span>
        </button>
        <button class="promoOpt" data-p="premium">
          <span class="po-ico">👑</span>
          <span class="po-txt"><b>Premium</b><small>7 gün · həmişə birinci</small></span>
          <span class="po-price">7 ₼</span>
        </button>
      </div>
      <div class="sup-row" style="margin-top:14px">
        <div class="sup-label">Kart nömrəsi</div>
        <div class="sup-num" id="promoCard">5315 9921 5789 0523</div>
        <button class="btn btn-primary sup-copy" id="promoCopy">Kopyala</button>
      </div>
      <div class="auth-msg" id="promoMsg"></div>
      <p class="ad-sub" style="margin-top:12px">Ödənişdən sonra VIP botuna yazın — elan dərhal önə çəkilir:</p>
      <a class="btn btn-primary auth-go" href="https://t.me/Boosted_mashinelanlari_bot"
         target="_blank" rel="noopener" style="margin-top:8px">🚀 VIP bota keç</a>
      <p class="ad-sub" style="margin-top:10px;font-size:12px">Paket adı + elan linkini yazın.
        <code id="promoCmd">/promo</code></p>
    </div>`;
  document.body.appendChild(promo);

  btn.addEventListener("click", () => {
    if (window.__user) { fillProfile(); toggleWrap("profWrap", true); }
    else toggleWrap("authWrap", true);
  });
  document.getElementById("authX").addEventListener("click", () => toggleWrap("authWrap", false));
  document.getElementById("promoX")?.addEventListener("click", () => toggleWrap("promoWrap", false));
  document.getElementById("promoCopy")?.addEventListener("click", function () {
    var t = document.getElementById("promoCard").textContent.replace(/\s/g, "");
    if (navigator.clipboard) navigator.clipboard.writeText(t);
    this.textContent = "Kopyalandı ✓";
    setTimeout(() => this.textContent = "Kopyala", 1500);
  });
  document.getElementById("adX").addEventListener("click", () => toggleWrap("adWrap", false));
  [wrap, form].forEach(w => w.addEventListener("click", e => {
    if (e.target === w) w.classList.remove("on");
  }));

  // "Elana bax" — qeydiyyat tələb et
  document.addEventListener("click", function (e) {
    const pb = e.target.closest("[data-promo]");
    if (pb) {
      e.preventDefault(); e.stopPropagation();
      if (window.__requireAuth && window.__requireAuth(
          "🚀 Elanı önə çıxarmaq üçün daxil olun və ya qeydiyyatdan keçin (pulsuz).")) return;
      window.__promoPost = pb.dataset.promo || "";
      const c0 = document.getElementById("promoCmd");
      if (c0) c0.textContent = "/promo " + (window.__promoPost || "<post>") + " vip";
      toggleWrap("promoWrap", true);
      return;
    }
    const op = e.target.closest(".promoOpt");
    if (op) {
      window.__promoType = op.dataset.p;
      document.querySelectorAll(".promoOpt").forEach(x => x.classList.remove("on"));
      op.classList.add("on");
      const c1 = document.getElementById("promoCmd");
      if (c1) c1.textContent = "/promo " + (window.__promoPost || "<post>") + " " + op.dataset.p;
      return;
    }
  }, true);

document.addEventListener("click", function (e) {
    const a = e.target.closest(".more");
    if (!a) return;
    if (!window.__authReady) return;
    if (window.__user && window.__user.emailVerified) return;
    if (window.__user) { e.preventDefault(); openVerify(); return; }
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
  try {
    await authMod.setPersistence(authMod.getAuth(app), authMod.browserLocalPersistence);
  } catch (e) { /* sus */ }
  fb = {
    auth: authMod.getAuth(app),
    authMod,
    db: fsMod.getFirestore(app),
    fsMod
  };

  const ab = document.getElementById("authBtn");
  if (ab) ab.textContent = "⏳ ...";
  authMod.onAuthStateChanged(fb.auth, (u) => {
    window.__user = u;
    window.__authReady = true;
    window.__verified = !!(u && u.emailVerified);
    const b = document.getElementById("authBtn");
    const nm = u ? (u.displayName || (u.email || "").split("@")[0]) : "";
    if (b) b.textContent = u ? "👤 " + nm : "👤 Daxil ol";
    if (u) {
      toggleWrap("authWrap", false);
      fillProfile();
      if (!u.emailVerified) openVerify();
      else markVerified();
    }
  });

  document.getElementById("authGo").addEventListener("click", doAuth);
  document.getElementById("adGo").addEventListener("click", submitAd);
  document.getElementById("authReset").addEventListener("click", resetPass);
  document.getElementById("profX").addEventListener("click", () => toggleWrap("profWrap", false));
  document.getElementById("profEdit").addEventListener("click", () => {
    const box = document.getElementById("profEditBox");
    const inp = document.getElementById("profInput");
    inp.value = (window.__user && (window.__user.displayName || "")) || "";
    box.style.display = box.style.display === "none" ? "block" : "none";
    if (box.style.display === "block") inp.focus();
  });
  document.getElementById("profSave").addEventListener("click", saveProfileName);
  document.getElementById("profOut").addEventListener("click", signOutNow);
  document.getElementById("profDel").addEventListener("click", function () {
    const b = document.getElementById("delBox");
    b.style.display = b.style.display === "none" ? "block" : "none";
  });
  document.getElementById("delNo").addEventListener("click", function () {
    document.getElementById("delBox").style.display = "none";
  });
  document.getElementById("delYes").addEventListener("click", deleteAccount);
  document.getElementById("verX").addEventListener("click", () => toggleWrap("verWrap", false));
  document.getElementById("verCheck").addEventListener("click", checkVerified);
  document.getElementById("verResend").addEventListener("click", resendVerify);
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
    if (e.code === "auth/email-already-in-use") {
      msg.textContent = "⚠️ Bu email artıq qeydiyyatdadır — «Daxil ol» tabına keçin.";
      const t = document.querySelector('.auth-tab[data-tab="login"]');
      if (t) t.click();
      const go = document.getElementById("authGo");
      if (go) go.textContent = "Daxil ol";
      return;
    }
    msg.textContent = "⚠️ " + (e.code === "auth/invalid-credential" ? "Email və ya şifrə yanlışdır"
      : e.code === "auth/weak-password" ? "Şifrə ən azı 6 simvol olmalıdır"
      : e.code === "auth/invalid-email" ? "Email düzgün deyil"
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

function openVerify() {
  const u = window.__user;
  const m = document.getElementById("verMail");
  if (m) m.textContent = u ? (u.email || "") : "";
  toggleWrap("verWrap", true);
}

async function markVerified() {
  const u = window.__user;
  if (!u || !u.emailVerified || !fb) return;
  const key = "verified_" + u.uid;
  if (localStorage.getItem(key)) return;
  try {
    await fb.fsMod.setDoc(fb.fsMod.doc(fb.db, "verified", u.uid), {
      email: u.email, uid: u.uid, createdAt: Date.now()
    });
    localStorage.setItem(key, "1");
  } catch (e) { console.log("verified yazilmadi", e); }
}

function requireVerified() {
  if (!window.__user) { toggleWrap("authWrap", true); return false; }
  if (!window.__user.emailVerified) { openVerify(); return false; }
  return true;
}

async function checkVerified() {
  const msg = document.getElementById("verMsg");
  try {
    await fb.auth.currentUser.reload();
    if (fb.auth.currentUser.emailVerified) {
      window.__user = fb.auth.currentUser;
      window.__verified = true;
      toggleWrap("verWrap", false);
      fillProfile();
      markVerified();
    } else if (msg) {
      msg.textContent = "Hələ təsdiqlənməyib — emailinizə baxın (Spam qovluğuna da).";
    }
  } catch (e) { if (msg) msg.textContent = "Xəta: " + e.message; }
}

async function resendVerify() {
  const msg = document.getElementById("verMsg");
  try {
    await fb.authMod.sendEmailVerification(fb.auth.currentUser);
    if (msg) msg.textContent = "✅ Link yenidən göndərildi.";
  } catch (e) { if (msg) msg.textContent = "Xəta: " + e.message; }
}

function fillProfile() {
  const u = window.__user;
  if (!u) return;
  const nm = u.displayName || (u.email || "").split("@")[0];
  const el = document.getElementById("profName");
  const ml = document.getElementById("profMail");
  const av = document.getElementById("profAva");
  if (el) el.textContent = nm;
  if (ml) ml.textContent = u.email || "";
  if (av) av.textContent = (nm[0] || "👤").toUpperCase();
  const t = document.getElementById("authBtn");
  if (t) t.textContent = "👤 " + nm;
  const box = document.getElementById("profEditBox");
  if (box) box.style.display = "none";
}

async function saveProfileName() {
  const v = (document.getElementById("profInput").value || "").trim();
  if (!v || !fb) return;
  try {
    await fb.authMod.updateProfile(fb.auth.currentUser, { displayName: v });
    fillProfile();
  } catch (e) { alert("Ad saxlanmadı: " + e.message); }
}

async function signOutNow() {
  try { await fb.authMod.signOut(fb.auth); } catch (e) {}
  toggleWrap("profWrap", false);
  const t = document.getElementById("authBtn");
  if (t) t.textContent = "👤 Daxil ol";
}

// Qeydiyyat tələb edən əməliyyatlar (seçilmişlər, paylaşma)
window.__requireAuth = function (msg) {
  if (window.__user) return false;
  toggleWrap("authWrap", true);
  const m = document.getElementById("authMsg");
  if (m) m.textContent = msg || "Davam etmək üçün daxil olun və ya qeydiyyatdan keçin.";
  const rt = document.querySelector('[data-tab="reg"]');
  if (rt) rt.click();
  return true;
};

async function deleteAccount() {
  const u = fb && fb.auth.currentUser;
  if (!u) return;
  const box = document.getElementById("delBox");
  if (box) box.style.display = "none";
  try {
    // Firestore-a silinmə sorğusu (admin görsün)
    try {
      await fb.fsMod.addDoc(fb.fsMod.collection(fb.db, "deletions"), {
        uid: u.uid, email: u.email || "", createdAt: new Date(), done: false
      });
    } catch (e) {}
    await fb.authMod.deleteUser(u);
    localStorage.clear();
    alert("✅ Hesabınız silindi. Bütün məlumatlar (seçilmişlər daxil) təmizləndi.");
  } catch (e) {
    // yenidən giriş tələb olunur → çıxış + sorğu qeydə alınıb
    alert("⚠️ Hesab silinməsi üçün yenidən daxil olmaq tələb olunur.\n" +
          "Sorğunuz qeydə alındı — 24 saat ərzində silinəcək.\n\n" +
          "İndi hesabdan çıxış edilir və yaddaşda qalan məlumatlar təmizlənir.");
    try { await fb.authMod.signOut(fb.auth); } catch (e2) {}
    localStorage.clear();
  }
  toggleWrap("profWrap", false);
  const t = document.getElementById("authBtn");
  if (t) t.textContent = "👤 Daxil ol";
  document.querySelectorAll(".act.on").forEach(b => { b.classList.remove("on"); b.textContent = "🤍"; });
  const fc = document.getElementById("favCount");
  if (fc) fc.textContent = "0";
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
        km = +g("adKm"), price = +g("adPrice"), phone = g("adPhone"), tg = g("adTg");
  if (!brand || !model || !year || !price || !phone) {
    msg.textContent = "⚠️ Marka, model, il, qiymət və telefon vacibdir.";
    return;
  }
  if (!tg) {
    msg.textContent = "❌ Telegram username mütləqdir — elan linki oraya göndəriləcək.";
    const el = document.getElementById("adTg");
    if (el) { el.style.borderColor = "#d6336c"; el.focus(); }
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
    msg.textContent = "✅ Elan gönderildi! Yoxlanıldıqdan sonra kanalda, saytda və Telegramınıza link göndəriləcək.";
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
