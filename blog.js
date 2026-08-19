/* ==========================================================================
   BLOG — busca os posts publicados via Decap CMS direto do GitHub.

   >>> PREENCHA AQUI depois de criar seu repositório no GitHub <<<
   Exemplo: se o link do seu repositório for
   https://github.com/duda-bincoleto/site-duda
   então:
     OWNER: "dbvinculoerotina",
REPO: "vinculoerotina",
   ========================================================================== */
const BLOG_CONFIG = {
  OWNER: "dbvinculoerotina",
REPO: "vinculoerotina",
  BRANCH: "main",
  POSTS_PATH: ""
};

function joinPath(...parts) {
  return parts.filter(Boolean).join('/');
}

function blogApiUrl() {
  const path = joinPath(BLOG_CONFIG.POSTS_PATH);
  return `https://api.github.com/repos/${BLOG_CONFIG.OWNER}/${BLOG_CONFIG.REPO}/contents/${path}?ref=${BLOG_CONFIG.BRANCH}`;
}

function rawUrl(path) {
  return `https://raw.githubusercontent.com/${BLOG_CONFIG.OWNER}/${BLOG_CONFIG.REPO}/${BLOG_CONFIG.BRANCH}/${path}`;
}

function isConfigured() {
  return BLOG_CONFIG.OWNER !== "SEU-USUARIO-GITHUB" && BLOG_CONFIG.REPO !== "SEU-REPOSITORIO";
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function fetchAllPosts() {
  const res = await fetch(blogApiUrl());
  if (!res.ok) throw new Error('Não foi possível listar os posts (' + res.status + ')');
  const files = await res.json();
  const jsonFiles = (Array.isArray(files) ? files : []).filter(f => f.name.endsWith('.json'));

  const posts = await Promise.all(jsonFiles.map(async (f) => {
    const r = await fetch(rawUrl(joinPath(BLOG_CONFIG.POSTS_PATH, f.name)));
    const data = await r.json();
    data.slug = f.name.replace(/\.json$/, '');
    return data;
  }));

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

async function renderBlogList() {
  const container = document.getElementById('blog-list');
  if (!container) return;

  if (!isConfigured()) {
    container.innerHTML = `
      <div class="blog-state" style="grid-column:1/-1; text-align:left; max-width:640px; margin:0 auto;">
        O blog ainda não está conectado ao GitHub.<br><br>
        Abra o arquivo <code>blog.js</code> e preencha <code>OWNER</code> e <code>REPO</code>
        com os dados do seu repositório — depois disso os textos publicados no
        painel (<a href="painel.html">/painel.html</a>) aparecem aqui automaticamente.
      </div>`;
    return;
  }

  try {
    const posts = await fetchAllPosts();
    if (!posts.length) {
      container.innerHTML = `<div class="blog-state" style="grid-column:1/-1;">Nenhum texto publicado ainda. Em breve!</div>`;
      return;
    }
    container.innerHTML = posts.map(p => `
      <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="blog-card">
        <div class="blog-card-media">
          ${p.cover ? `<img src="${rawUrl(p.cover.replace(/^\//,''))}" alt="${p.title || ''}">` : ''}
        </div>
        <div class="blog-card-body">
          <div class="blog-card-date">${formatDate(p.date)}</div>
          <h3>${p.title || 'Sem título'}</h3>
          <p>${p.excerpt || ''}</p>
          <div class="blog-card-link">Ler texto →</div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="blog-state" style="grid-column:1/-1;">Não foi possível carregar os textos agora. Tente novamente em instantes.</div>`;
    console.error(err);
  }
}

async function renderSinglePost() {
  const container = document.getElementById('post-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!isConfigured()) {
    container.innerHTML = `
      <div class="blog-state" style="text-align:left;">
        O blog ainda não está conectado ao GitHub. Preencha <code>OWNER</code> e
        <code>REPO</code> em <code>blog.js</code>.
      </div>`;
    return;
  }

  if (!slug) {
    container.innerHTML = `<div class="blog-state">Texto não encontrado.</div>`;
    return;
  }

  try {
    const res = await fetch(rawUrl(joinPath(BLOG_CONFIG.POSTS_PATH, `${slug}.json`)));
    if (!res.ok) throw new Error('not found');
    const post = await res.json();

    document.getElementById('page-title').textContent = (post.title || 'Post') + ' — Duda Bincoleto';
    if (post.excerpt) document.getElementById('page-desc').setAttribute('content', post.excerpt);
    const ogTitle = document.getElementById('og-title');
    const ogDesc = document.getElementById('og-desc');
    const ogImage = document.getElementById('og-image');
    if (ogTitle) ogTitle.setAttribute('content', (post.title || 'Post') + ' — Duda Bincoleto');
    if (ogDesc && post.excerpt) ogDesc.setAttribute('content', post.excerpt);
    if (ogImage && post.cover) ogImage.setAttribute('content', rawUrl(post.cover.replace(/^\//,'')));

    const bodyHtml = (typeof marked !== 'undefined') ? marked.parse(post.body || '') : (post.body || '');

    container.innerHTML = `
      <div class="post-meta">
        <span class="eyebrow">${formatDate(post.date)}</span>
      </div>
      <h1 style="font-size:clamp(30px,4.5vw,46px); margin-bottom:8px;">${post.title || ''}</h1>
      ${post.excerpt ? `<p style="font-family:var(--serif); font-style:italic; font-size:19px; color:var(--mid); margin-bottom:8px;">${post.excerpt}</p>` : ''}
      ${post.cover ? `<div class="post-cover"><img src="${rawUrl(post.cover.replace(/^\//,''))}" alt="${post.title || ''}"></div>` : ''}
      <div class="post-body">${bodyHtml}</div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="blog-state">Não foi possível carregar este texto.</div>`;
    console.error(err);
  }
}
