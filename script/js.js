const SUPABASE_URL = "https://bqnmsekhfndojjkwpvdk.supabase.co";
const SUPABASE_KEY = "sb_publishable_lFPD7Bo8GzQEaxkoNGJXHw_FX0BkODJ";

// Alguns WebViews bloqueiam ou lançam exceções ao acessar localStorage.
// Mantém uma cópia em memória como fallback para a sessão atual.
const memoryStorage = new Map();
const safeStorage = {
    getItem(key) {
        try {
            const value = window.localStorage.getItem(key);
            if (value !== null) memoryStorage.set(key, value);
            return value ?? memoryStorage.get(key) ?? null;
        } catch (_) {
            return memoryStorage.get(key) ?? null;
        }
    },
    setItem(key, value) {
        const text = String(value);
        memoryStorage.set(key, text);
        try { window.localStorage.setItem(key, text); } catch (_) { /* fallback em memória */ }
    },
    removeItem(key) {
        memoryStorage.delete(key);
        try { window.localStorage.removeItem(key); } catch (_) { /* fallback em memória */ }
    },
};

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: safeStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

const CATS = {
    out: [
        ["Alimentação", "utensils"],
        ["Transporte", "car"],
        ["Moradia", "house"],
        ["Lazer", "film"],
        ["Saúde", "heart-pulse"],
        ["Outros", "shapes"],
    ],
    in: [
        ["Salário", "briefcase"],
        ["Freela", "laptop-code"],
        ["Investimentos", "chart-line"],
        ["Outros", "gift"],
    ],
};
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ic = (t, c) => `<i class="fa-solid fa-${(CATS[t].find((x) => x[0] === c) || [0, "shapes"])[1]}"></i>`;
const fmtDate = (d) => d.split("-").reverse().join("/");
function toast(m) {
    const t = $("toast");
    t.textContent = m;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1900);
}

let tx = [],
    filter = "all",
    type = "out",
    cat = "Alimentação",
    mode = "in",
    user = null;

/* ---------- Auth ---------- */
function showAuth() {
    $("boot").classList.add("hide");
    $("main").classList.add("hide");
    $("auth").classList.remove("hide");
}
async function showApp(u) {
    user = u;
    $("boot").classList.add("hide");
    $("auth").classList.add("hide");
    $("main").classList.remove("hide");
    const h = new Date().getHours();
    $("hello").textContent = (h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite") + "!";
    $("who").textContent = u.email;
    await loadTx();
}
function translate(m) {
    if (/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
    if (/already registered/i.test(m)) return "Este e-mail já tem conta. Use Entrar.";
    if (/at least 6/i.test(m)) return "A senha precisa ter ao menos 6 caracteres.";
    if (/valid email|invalid format/i.test(m)) return "Digite um e-mail válido.";
    if (/not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar.";
    return "Não foi possível concluir. Tente novamente.";
}
function setMode(m) {
    mode = m;
    document.querySelectorAll("#authSeg button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
    $("authBtnTxt").textContent = m === "in" ? "Entrar" : "Criar conta";
    $("pass").autocomplete = m === "in" ? "current-password" : "new-password";
    $("authMsg").textContent = "";
    $("authMsg").classList.remove("ok");
}
$("authSeg").onclick = (e) => {
    const b = e.target.closest("button");
    if (b) setMode(b.dataset.m);
};
$("eye").onclick = () => {
    const p = $("pass"),
        show = p.type === "password";
    p.type = show ? "text" : "password";
    $("eye").innerHTML = `<i class="fa-solid fa-eye${show ? "-slash" : ""}"></i>`;
    $("eye").setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
};
async function submitAuth() {
    const email = $("email").value.trim(),
        password = $("pass").value,
        msg = $("authMsg");
    msg.classList.remove("ok");
    if (!email || !password) {
        msg.textContent = "Preencha e-mail e senha.";
        return;
    }
    const btn = $("authBtn");
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    $("authBtnTxt").innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ${mode === "in" ? "Entrando..." : "Criando conta..."}`;
    try {
        if (mode === "in") {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
        emailRedirectTo: "https://js171555.github.io/meu_bolso/"
    }
});
            if (error) throw error;
            if (!data.session) {
                msg.classList.add("ok");
                msg.textContent = "Conta criada! Confirme o link enviado ao seu e-mail e depois entre.";
            }
        }
    } catch (err) {
        msg.textContent = translate(err.message || "");
    } finally {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        $("authBtnTxt").textContent = mode === "in" ? "Entrar" : "Criar conta";
    }
}
$("authBtn").onclick = submitAuth;
$("pass").onkeydown = (e) => {
    if (e.key === "Enter") submitAuth();
};
$("logout").onclick = async () => {
    const btn = $("logout");
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
    try {
        // scope:"local" remove a sessão deste dispositivo sem depender da
        // disponibilidade do endpoint de logout global (importante em WebViews).
        const { error } = await sb.auth.signOut({ scope: "local" });
        if (error) throw error;
        user = null;
        tx = [];
        showAuth();
        toast("Você saiu da sua conta.");
    } catch (err) {
        console.error("Falha ao encerrar sessão:", err);
        // Não mantenha a tela autenticada presa caso a limpeza local tenha
        // falhado por limitação do armazenamento do WebView.
        user = null;
        tx = [];
        showAuth();
        toast("Sessão encerrada neste aparelho. Se necessário, feche e abra o app.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
    }
};

sb.auth.onAuthStateChange((ev, session) => {
    if (session && session.user) {
        if (!user || user.id !== session.user.id) setTimeout(() => showApp(session.user), 0);
    } else {
        user = null;
        tx = [];
        showAuth();
    }
});
sb.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.warn("Não foi possível verificar a sessão:", error);
        toast("Não foi possível verificar sua sessão. Tente entrar novamente.");
    }
    if (!data?.session) showAuth();
}).catch((err) => {
    console.warn("Falha ao recuperar sessão:", err);
    toast("Não foi possível verificar sua sessão. Verifique a conexão e entre novamente.");
    showAuth();
});

/* ---------- Dados ---------- */
async function loadTx() {
    const list = $("list");
    let failed = false;
    list.setAttribute("aria-busy", "true");
    list.innerHTML = '<div class="skeleton-row" aria-hidden="true"></div><div class="skeleton-row" aria-hidden="true"></div><div class="skeleton-row" aria-hidden="true"></div>';
    try {
        const { data, error } = await sb
            .from("transactions")
            .select("*")
            .order("date", { ascending: false })
            .order("created_at", { ascending: false });
        if (error) throw error;
        tx = (data || []).map((r) => ({
            id: r.id, type: r.type, amount: Number(r.amount), desc: r.description,
            cat: r.category, date: r.date,
        }));
    } catch (err) {
        toast("Erro ao carregar dados. Tente novamente.");
        tx = [];
        failed = true;
    } finally {
        list.removeAttribute("aria-busy");
        render();
        if (failed) list.innerHTML = '<div class="empty">Não foi possível carregar as movimentações.<br><button class="retry" type="button">Tentar novamente</button></div>';
    }
}
function render() {
    const inc = tx.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const exp = tx.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
    $("bal").textContent = brl.format(inc - exp);
    $("inc").textContent = brl.format(inc);
    $("exp").textContent = brl.format(exp);
    const rows = tx.filter((t) => filter === "all" || t.type === filter);
    $("list").innerHTML = rows.length
        ? rows
              .map(
                  (t) => `
    <div class="tx">
      <div class="ico">${ic(t.type, t.cat)}</div>
      <div class="info"><b>${esc(t.desc)}</b><span>${esc(t.cat)} · ${fmtDate(t.date)}</span></div>
      <div class="amt ${t.type}">${t.type === "in" ? "+" : "-"} ${brl.format(t.amount)}</div>
      <button class="del" data-id="${t.id}" aria-label="Excluir ${esc(t.desc)}"><i class="fa-solid fa-trash-can"></i></button>
    </div>`
              )
              .join("")
        : `<div class="empty">Nada por aqui ainda. Toque em + para registrar sua primeira movimentação.</div>`;
    const by = {};
    tx.filter((t) => t.type === "out").forEach((t) => (by[t.cat] = (by[t.cat] || 0) + t.amount));
    const arr = Object.entries(by).sort((a, b) => b[1] - a[1]);
    $("cats").innerHTML = arr.length
        ? arr
              .map(
                  ([c, v]) => `
    <div class="bar-row"><div class="bar-head"><span>${ic("out", c)} ${esc(c)}</span><b>${brl.format(v)}</b></div>
    <div class="track"><div class="fill" style="width:${Math.max(4, (v / exp) * 100)}%"></div></div></div>`
              )
              .join("")
        : `<p style="color:var(--muted);font-size:.9rem">Sem despesas registradas.</p>`;
    const top = tx
            .filter((t) => t.type === "in")
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3),
        max = top[0] ? top[0].amount : 1;
    $("incs").innerHTML = top.length
        ? top
              .map(
                  (t) => `
    <div class="bar-row"><div class="bar-head"><span>${ic("in", t.cat)} ${esc(t.desc)}</span><b>${brl.format(t.amount)}</b></div>
    <div class="track"><div class="fill" style="width:${(t.amount / max) * 100}%"></div></div></div>`
              )
              .join("")
        : `<p style="color:var(--muted);font-size:.9rem">Sem receitas registradas.</p>`;
}

/* ---------- Folha de nova movimentação ---------- */
function renderChips() {
    $("chips").innerHTML = CATS[type]
        .map(
            ([c, i]) =>
                `<button class="chip ${c === cat ? "on" : ""}" data-c="${c}"><i class="fa-solid fa-${i}"></i> ${c}</button>`
        )
        .join("");
}
function openSheet() {
    type = "out";
    cat = CATS.out[0][0];
    $("amount").value = "";
    $("desc").value = "";
    $("date").value = today();
    $("err").textContent = "";
    document.querySelectorAll(".type button").forEach((b) => b.classList.toggle("on", b.dataset.t === type));
    renderChips();
    $("ov").classList.add("open");
    $("sheet").classList.add("open");
    setTimeout(() => $("amount").focus(), 250);
}
function closeSheet() {
    $("ov").classList.remove("open");
    $("sheet").classList.remove("open");
}
$("add").onclick = openSheet;
$("add2").onclick = openSheet;
window.addEventListener("error", (e) => toast("Erro: " + e.message));
$("ov").onclick = closeSheet;
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
});
document.querySelector(".type").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    type = b.dataset.t;
    cat = CATS[type][0][0];
    document.querySelectorAll(".type button").forEach((x) => x.classList.toggle("on", x === b));
    renderChips();
};
$("chips").onclick = (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    cat = b.dataset.c;
    renderChips();
};
$("seg").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    filter = b.dataset.f;
    document.querySelectorAll("#seg button").forEach((x) => x.classList.toggle("on", x === b));
    render();
};
document.querySelectorAll(".tab").forEach(
    (b) =>
        (b.onclick = () => {
            document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === b));
            $("v-home").classList.toggle("hide", b.dataset.v !== "home");
            $("v-sum").classList.toggle("hide", b.dataset.v !== "sum");
            window.scrollTo(0, 0);
        })
);
$("list").onclick = async (e) => {
    if (e.target.closest(".retry")) { loadTx(); return; }
    const b = e.target.closest(".del");
    if (!b || b.disabled) return;
    const original = b.innerHTML;
    b.disabled = true;
    b.setAttribute("aria-busy", "true");
    b.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
    try {
        const { error } = await sb.from("transactions").delete().eq("id", b.dataset.id);
        if (error) throw error;
        tx = tx.filter((t) => String(t.id) !== b.dataset.id);
        render();
        toast("Movimentação excluída");
    } catch (err) {
        b.disabled = false;
        b.removeAttribute("aria-busy");
        b.innerHTML = original;
        toast("Não foi possível excluir. Tente novamente.");
    }
};
$("save").onclick = async () => {
    const btn = $("save");
    if (btn.disabled) return;
    const v = parseFloat($("amount").value.replace(/\./g, "").replace(",", "."));
    const d = $("desc").value.trim();
    if (!(v > 0)) { $("err").textContent = "Informe um valor maior que zero."; return; }
    if (!d) { $("err").textContent = "Informe uma descrição."; return; }
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Salvando...';
    $("err").textContent = "";
    try {
        const { data, error } = await sb.from("transactions")
            .insert({ type, amount: v, description: d, category: cat, date: $("date").value || today() })
            .select().single();
        if (error) throw error;
        tx.unshift({ id: data.id, type: data.type, amount: Number(data.amount), desc: data.description,
            cat: data.category, date: data.date });
        tx.sort((a, b) => b.date.localeCompare(a.date));
        render();
        closeSheet();
        toast("Movimentação salva");
    } catch (err) {
        console.error(err);
        $("err").textContent = "Erro ao salvar: " + (err.message || "tente novamente");
    } finally {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvar movimentação';
    }
};
