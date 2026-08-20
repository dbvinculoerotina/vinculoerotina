/* ==========================================================================
   BLOG — busca os posts publicados via Decap CMS direto do GitHub.
   ========================================================================== */
const BLOG_CONFIG = {
  OWNER: "dbvinculoerotina",
  REPO: "vinculoerotina",
  BRANCH: "main",
  POSTS_PATH: "posts"
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
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year:
