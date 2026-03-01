// ─── State ───────────────────────────────────────────────────────
let allPlans = [];
let openPlanFile = null;
let plansFingerprint = '';
const POLL_INTERVAL = 3000;
const STATES = ['draft', 'backlog', 'coding', 'done'];
let layoutMode = null; // 'subfolders' or 'flat' — auto-detected
const STATE_COLORS = {
  draft:   'bg-draft',
  backlog: 'bg-backlog',
  coding:  'bg-coding',
  done:    'bg-done',
};

// ─── i18n ─────────────────────────────────────────────────────
const I18N = {
  en: {
    pageTitle: 'Workplans Progress',
    headerTitle: 'Workplans',
    headerBadge: 'Progress',
    colDraft: 'Draft',    colBacklog: 'Backlog',
    colCoding: 'Coding',  colDone: 'Done',
    loading: 'Loading plans...',
    errorMsg: 'To view plans in real time, run a local server from the workplans folder:',
    emptyState: 'No plans yet',
    author: 'Author',     assignee: 'Assignee',
    issue: 'Issue',       columnRules: 'Column rules',
    live: 'Live',         toggleDark: 'Toggle dark mode',
    autoRefresh: 'Auto-refresh active',
    steps: '{checked}/{total} steps',
    planOne: '{total} plan',  planMany: '{total} plans',
  },
  es: {
    pageTitle: 'Workplans Progreso',
    headerTitle: 'Workplans',
    headerBadge: 'Progreso',
    colDraft: 'Draft',    colBacklog: 'Backlog',
    colCoding: 'Coding',  colDone: 'Done',
    loading: 'Cargando planes...',
    errorMsg: 'Para ver los planes en tiempo real, ejecuta un servidor local desde la carpeta workplans:',
    emptyState: 'Sin planes aún',
    author: 'Autor',     assignee: 'Asignado',
    issue: 'Incidencia',  columnRules: 'Reglas de columna',
    live: 'En vivo',      toggleDark: 'Cambiar modo oscuro',
    autoRefresh: 'Auto-actualización activa',
    steps: '{checked}/{total} pasos',
    planOne: '{total} plan',  planMany: '{total} planes',
  }
};

const LANG = document.documentElement.lang || 'en';
const strings = I18N[LANG] || I18N.en;

function t(key, vars = {}) {
  let s = strings[key] || I18N.en[key] || key;
  for (const [k, v] of Object.entries(vars))
    s = s.replace(`{${k}}`, v);
  return s;
}

function translateUI() {
  document.title = t('pageTitle');
  document.getElementById('header-title').textContent = t('headerTitle');
  document.getElementById('header-badge').textContent = t('headerBadge');
  document.getElementById('live-indicator').title = t('autoRefresh');
  document.getElementById('live-label').textContent = t('live');
  document.getElementById('theme-toggle').title = t('toggleDark');
  document.getElementById('loading-text').textContent = t('loading');
  document.getElementById('error-msg').textContent = t('errorMsg');
  document.getElementById('heading-draft').textContent = t('colDraft');
  document.getElementById('heading-backlog').textContent = t('colBacklog');
  document.getElementById('heading-coding').textContent = t('colCoding');
  document.getElementById('heading-done').textContent = t('colDone');
  STATES.forEach(s => {
    const btn = document.getElementById(`info-${s}`);
    if (btn) btn.title = t('columnRules');
  });
}

translateUI();

// ─── Model Icons ──────────────────────────────────────────────
const ICON_CDN = 'vendor/icons';
const MODEL_ICONS = {
  claude:   { file: 'claude-color.png',   mono: false },
  openai:   { file: 'openai.png',         mono: true },
  gpt:      { file: 'openai.png',         mono: true },
  chatgpt:  { file: 'openai.png',         mono: true },
  gemini:   { file: 'gemini-color.png',   mono: false },
  deepseek: { file: 'deepseek-color.png', mono: false },
  mistral:  { file: 'mistral-color.png',  mono: false },
  grok:     { file: 'grok.png',           mono: true },
  llama:    { file: 'meta-color.png',     mono: false },
  copilot:  { file: 'github.png',         mono: true },
  cohere:   { file: 'cohere-color.png',   mono: false },
  groq:     { file: 'groq.png',           mono: true },
};

function getModelIcon(modelStr) {
  if (!modelStr) return null;
  const lower = modelStr.toLowerCase().trim();
  for (const [prefix, val] of Object.entries(MODEL_ICONS)) {
    if (lower.startsWith(prefix)) {
      return { icon: `${ICON_CDN}/${val.file}`, name: modelStr.trim(), mono: val.mono };
    }
  }
  return null;
}

function getModelIcons(modelStr) {
  if (!modelStr) return [];
  return modelStr.split(',').map(m => getModelIcon(m.trim())).filter(Boolean);
}

// ─── Dark Mode ───────────────────────────────────────────────────
function initTheme() {
  const stored = localStorage.getItem('workplans-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  document.getElementById('icon-sun').classList.toggle('hidden', !isDark);
  document.getElementById('icon-moon').classList.toggle('hidden', isDark);
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('workplans-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  updateThemeIcons();
});

initTheme();

// ─── Directory Listing Parser ────────────────────────────────────
function parseMdFilesFromListing(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  const files = [];
  links.forEach(a => {
    const href = decodeURIComponent(a.getAttribute('href') || '');
    if (!href.endsWith('.md')) return;
    // Extract just the filename (handles full paths from Live Server, etc.)
    const basename = href.split('/').filter(Boolean).pop() || '';
    if (basename.startsWith('.') || basename.toUpperCase() === 'README.MD') return;
    files.push(basename);
  });
  return files;
}

// ─── Frontmatter Parser ─────────────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = jsyaml.load(match[1]) || {};
  const body = content.slice(match[0].length).trim();
  return { meta, body };
}

// ─── Slug (author_description only, omits status & date) ────────
function planSlug(filename) {
  return filename.replace(/\.md$/, '').replace(/^[A-Z]+-\d{4}-\d{2}-\d{2}-/, '');
}

// ─── Progress Calculator ─────────────────────────────────────────
function calcProgress(raw) {
  const total = (raw.match(/- \[[ x]\]/g) || []).length;
  if (total === 0) return null;
  const checked = (raw.match(/- \[x\]/g) || []).length;
  return { checked, total, pct: Math.round((checked / total) * 100) };
}

// ─── Mode Detection ──────────────────────────────────────────────
async function detectMode() {
  const probes = await Promise.allSettled(
    STATES.map(state => fetch(`../${state}/`))
  );
  return probes.some(r => r.status === 'fulfilled' && r.value.ok)
    ? 'subfolders' : 'flat';
}

// ─── Fetch Plans (subfolders mode) ────────────────────────────────
async function fetchPlansSubfolders() {
  const plans = [];

  const results = await Promise.allSettled(
    STATES.map(async (state) => {
      let response;
      try {
        response = await fetch(`../${state}/`);
      } catch {
        return [];
      }
      if (!response.ok) return [];

      const html = await response.text();
      const files = parseMdFilesFromListing(html);

      const filePlans = await Promise.allSettled(
        files.map(async (file) => {
          const res = await fetch(`../${state}/${file}`);
          if (!res.ok) return null;
          const text = await res.text();
          const { meta, body } = parseFrontmatter(text);
          return {
            file,
            state: (meta.state || state).toLowerCase(),
            title: meta.plan || file.replace(/\.md$/, ''),
            author: meta.author || '',
            author_model: meta.author_model || '',
            assignee: meta.assignee || '',
            assignee_model: meta.assignee_model || '',
            tags: meta.tags || '',
            backlog: meta.backlog || '',
            coding: meta.coding || '',
            done: meta.done || '',
            issue: meta.issue || '',
            progress: calcProgress(text),
            body,
            raw: text,
            folder: state,
          };
        })
      );

      return filePlans
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);
    })
  );

  results.forEach(r => {
    if (r.status === 'fulfilled') plans.push(...r.value);
  });

  return plans;
}

// ─── Fetch Plans (flat mode) ──────────────────────────────────────
async function fetchPlansFlat() {
  let response;
  try {
    response = await fetch('../');
  } catch {
    return [];
  }
  if (!response.ok) return [];

  const html = await response.text();
  const files = parseMdFilesFromListing(html);

  const filePlans = await Promise.allSettled(
    files.map(async (file) => {
      const res = await fetch(`../${file}`);
      if (!res.ok) return null;
      const text = await res.text();
      const { meta, body } = parseFrontmatter(text);

      // Determine state: frontmatter first, then filename prefix
      let state = (meta.state || '').toLowerCase();
      if (!STATES.includes(state)) {
        const prefix = file.split('-')[0].toLowerCase();
        state = STATES.includes(prefix) ? prefix : 'draft';
      }

      return {
        file,
        state,
        title: meta.plan || file.replace(/\.md$/, ''),
        author: meta.author || '',
        author_model: meta.author_model || '',
        assignee: meta.assignee || '',
        assignee_model: meta.assignee_model || '',
        tags: meta.tags || '',
        backlog: meta.backlog || '',
        coding: meta.coding || '',
        done: meta.done || '',
        issue: meta.issue || '',
        progress: calcProgress(text),
        body,
        raw: text,
        folder: null,
      };
    })
  );

  return filePlans
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}

// ─── Fetch Plans (auto-detect mode) ───────────────────────────────
async function fetchPlans() {
  if (!layoutMode) {
    layoutMode = await detectMode();
    // Hide column info links in flat mode
    if (layoutMode === 'flat') {
      STATES.forEach(s => {
        const el = document.getElementById(`info-${s}`);
        if (el) el.classList.add('hidden');
      });
    }
  }

  if (layoutMode === 'flat') return fetchPlansFlat();

  // Subfolder mode: also scan root for stray files (mixed support)
  const [subfolderPlans, rootPlans] = await Promise.all([
    fetchPlansSubfolders(),
    fetchPlansFlat(),
  ]);
  const seen = new Set(subfolderPlans.map(p => p.file));
  const strayPlans = rootPlans.filter(p => !seen.has(p.file));
  return [...subfolderPlans, ...strayPlans];
}

// ─── Render Card ─────────────────────────────────────────────────
function createCard(plan) {
  const card = document.createElement('div');
  card.className = 'group bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600 transition-all';

  // Most recent date
  const date = plan.done || plan.coding || plan.backlog || '';

  // Tags
  const tagsHtml = plan.tags
    ? plan.tags.split(',').map(s => s.trim()).filter(Boolean).map(tag =>
        `<span class="inline-block text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">${tag}</span>`
      ).join('')
    : '';

  // Progress ring (compact, same size as side panel)
  const r = 6, circ = 2 * Math.PI * r;
  const p = plan.progress;
  let progressHtml = '';
  if (p) {
    const offset = circ - (p.pct / 100) * circ;
    const color = p.pct === 100 ? '#22c55e' : '#a3a3a3';
    progressHtml = `
      <div class="flex items-center gap-1 ml-auto flex-shrink-0" title="${t('steps', {checked: p.checked, total: p.total})}">
        <span class="text-xs font-medium text-neutral-500 dark:text-neutral-500">${p.pct}%</span>
        <svg width="16" height="16" viewBox="0 0 16 16" class="flex-shrink-0">
          <circle cx="8" cy="8" r="${r}" fill="none" stroke-width="2" class="stroke-neutral-200 dark:stroke-neutral-700"/>
          <circle cx="8" cy="8" r="${r}" fill="none" stroke-width="2" stroke="${color}" stroke-linecap="round"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
            transform="rotate(-90 8 8)" style="transition: stroke-dashoffset 0.4s ease"/>
        </svg>
      </div>`;
  }

  // Footer: author (left) + model icon(s) (right)
  const models = getModelIcons(plan.author_model);
  const hasFooter = plan.author || models.length;
  let footerHtml = '';
  if (hasFooter) {
    let modelsHtml = '';
    if (models.length) {
      modelsHtml = `<span class="flex items-center gap-1">
        ${models.map(m => `<img src="${m.icon}" alt="${m.name}" title="${m.name}" class="w-3.5 h-3.5 flex-shrink-0 cursor-default ${m.mono ? 'invert dark:invert-0' : ''}" loading="lazy">`).join('')}
      </span>`;
    }
    footerHtml = `
      <div class="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
        ${plan.author ? `<span class="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-600">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          ${plan.author.split(',')[0].trim()}
        </span>` : '<span></span>'}
        ${modelsHtml}
      </div>`;
  }

  const dotColor = STATE_COLORS[plan.state] || 'bg-neutral-400';
  card.innerHTML = `
    <div class="flex items-start gap-2">
      <span class="w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0 mt-1"></span>
      <h3 class="font-medium text-sm leading-snug group-hover:text-neutral-600 dark:group-hover:text-white transition-colors flex-1">${plan.title}</h3>
      ${progressHtml}
    </div>
    <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500 mt-2 mb-2">
      ${date ? `<span class="flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        ${date}
      </span>` : ''}
    </div>
    ${tagsHtml ? `<div class="flex flex-wrap gap-1">${tagsHtml}</div>` : ''}
    ${footerHtml}
  `;

  card.addEventListener('click', () => openModal(plan));
  return card;
}

// ─── Empty State ─────────────────────────────────────────────────
function createEmptyState() {
  const div = document.createElement('div');
  div.className = 'text-center py-8 text-neutral-400 dark:text-neutral-600';
  div.innerHTML = `
    <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    <p class="text-sm">${t('emptyState')}</p>
  `;
  return div;
}

// ─── Comment Processing ─────────────────────────────────────────
function processComments(container) {
  // Find the "Comments" h2
  const headings = container.querySelectorAll('h2');
  let commentsH2 = null;
  for (const h of headings) {
    if (h.textContent.trim().toLowerCase() === 'comments') {
      commentsH2 = h;
      break;
    }
  }
  if (!commentsH2) return;

  // Collect all sibling nodes after the Comments h2
  const siblings = [];
  let node = commentsH2.nextSibling;
  while (node) {
    const next = node.nextSibling;
    // Stop if we hit another h2 (a different section)
    if (node.nodeType === 1 && node.tagName === 'H2') break;
    siblings.push(node);
    node = next;
  }

  // Create a wrapper for the comments section
  const wrapper = document.createElement('div');
  wrapper.className = 'comments-section';

  // Group siblings into comment blocks (each starts with an h3)
  let currentBlock = null;
  let currentBody = null;

  for (const el of siblings) {
    if (el.nodeType === 1 && el.tagName === 'H3') {
      // Start a new comment block
      if (currentBlock) wrapper.appendChild(currentBlock);

      currentBlock = document.createElement('div');
      currentBlock.className = 'comment-block';

      const header = document.createElement('div');
      header.className = 'comment-header';
      header.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>${el.textContent}</span>`;

      currentBody = document.createElement('div');
      currentBody.className = 'comment-body';

      currentBlock.appendChild(header);
      currentBlock.appendChild(currentBody);
    } else if (currentBody && el.nodeType === 1) {
      currentBody.appendChild(el.cloneNode(true));
    }
    // Remove original node from container
    el.parentNode && el.parentNode.removeChild(el);
  }
  if (currentBlock) wrapper.appendChild(currentBlock);

  // Replace the original h2 text with styled version and insert wrapper
  commentsH2.insertAdjacentElement('afterend', wrapper);
}

// ─── Modal ───────────────────────────────────────────────────────
function openModal(plan) {
  const modal = document.getElementById('modal');
  const stateColor = {
    draft: 'bg-draft', backlog: 'bg-backlog',
    coding: 'bg-coding', done: 'bg-done'
  };
  const stateBadge = {
    draft: 'bg-draft-light text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    backlog: 'bg-backlog-light text-neutral-700 dark:bg-blue-950 dark:text-blue-300',
    coding: 'bg-coding-light text-neutral-700 dark:bg-amber-950 dark:text-amber-300',
    done: 'bg-done-light text-neutral-700 dark:bg-green-950 dark:text-green-300'
  };

  openPlanFile = plan.file;
  document.getElementById('modal-title').textContent = plan.title;
  document.getElementById('modal-state-dot').className = `w-3 h-3 rounded-full ${stateColor[plan.state] || 'bg-neutral-400'}`;

  // Meta info (state badge + progress ring inline + rest of meta)
  const metaEl = document.getElementById('modal-meta');
  const metaItems = [];
  metaItems.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${stateBadge[plan.state] || 'bg-neutral-200 text-neutral-600'}">${plan.state}</span>`);

  // Compact progress ring in meta bar
  const mp = plan.progress;
  if (mp) {
    const r = 6, circ = 2 * Math.PI * r;
    const offset = circ - (mp.pct / 100) * circ;
    const color = mp.pct === 100 ? '#22c55e' : '#a3a3a3';
    metaItems.push(`<span class="inline-flex items-center gap-1.5" title="${t('steps', {checked: mp.checked, total: mp.total})}"><span class="text-xs font-medium">${mp.pct}%</span><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="${r}" fill="none" stroke-width="2" class="stroke-neutral-200 dark:stroke-neutral-700"/><circle cx="8" cy="8" r="${r}" fill="none" stroke-width="2" stroke="${color}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 8 8)"/></svg></span>`);
  }
  const date = plan.done || plan.coding || plan.backlog || '';
  if (date) metaItems.push(`<span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>${date}</span>`);
  if (plan.issue) metaItems.push(`<a href="${plan.issue}" target="_blank" rel="noopener" class="flex items-center gap-1 text-neutral-900 dark:text-neutral-100 underline hover:text-neutral-600 dark:hover:text-neutral-300"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>${t('issue')}</a>`);
  if (plan.tags) {
    plan.tags.split(',').map(s => s.trim()).filter(Boolean).forEach(tag => {
      metaItems.push(`<span class="px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">${tag}</span>`);
    });
  }

  metaEl.innerHTML = metaItems.join('');

  // Author & Assignee row (separate from meta)
  const authorsEl = document.getElementById('modal-authors');
  const sameUser = plan.author && plan.assignee && plan.author === plan.assignee;
  const sameModel = plan.author_model && plan.assignee_model && plan.author_model === plan.assignee_model;
  const personIcon = `<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;

  function modelIconsHtml(modelStr) {
    return getModelIcons(modelStr).map(m =>
      `<img src="${m.icon}" alt="${m.name}" title="${m.name}" class="w-3.5 h-3.5 flex-shrink-0 ${m.mono ? 'invert dark:invert-0' : ''}">`
    ).join('');
  }

  const authorItems = [];
  if (sameUser && sameModel) {
    authorItems.push(`<span class="flex items-center gap-1.5">${personIcon}${plan.author} ${modelIconsHtml(plan.author_model)}</span>`);
  } else {
    if (plan.author) {
      const authorModels = modelIconsHtml(plan.author_model);
      const label = plan.assignee ? `<span class="text-neutral-400 dark:text-neutral-600">${t('author')}</span> ` : '';
      authorItems.push(`<span class="flex items-center gap-1.5">${personIcon}${label}${plan.author} ${authorModels}</span>`);
    }
    if (plan.assignee) {
      const assigneeModels = modelIconsHtml(plan.assignee_model);
      const label = plan.author ? `<span class="text-neutral-400 dark:text-neutral-600">${t('assignee')}</span> ` : '';
      authorItems.push(`<span class="flex items-center gap-1.5">${personIcon}${label}${plan.assignee} ${assigneeModels}</span>`);
    }
  }

  if (authorItems.length) {
    authorsEl.innerHTML = authorItems.join('<span class="text-neutral-300 dark:text-neutral-700">|</span>');
    authorsEl.classList.remove('hidden');
  } else {
    authorsEl.innerHTML = '';
    authorsEl.classList.add('hidden');
  }

  // Body
  const bodyEl = document.getElementById('modal-body');
  bodyEl.innerHTML = marked.parse(plan.body);
  processComments(bodyEl);

  // Update URL hash (author_description only — stable across state/date changes)
  history.replaceState(null, '', `#${planSlug(plan.file)}`);

  // Show panel with animation
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    document.getElementById('modal-backdrop').classList.remove('opacity-0');
    document.getElementById('panel').classList.remove('translate-x-full');
  });
}

function closeModal() {
  openPlanFile = null;
  // Clear URL hash
  history.replaceState(null, '', window.location.pathname + window.location.search);

  const backdrop = document.getElementById('modal-backdrop');
  const panel = document.getElementById('panel');
  backdrop.classList.add('opacity-0');
  panel.classList.add('translate-x-full');
  panel.addEventListener('transitionend', function handler() {
    panel.removeEventListener('transitionend', handler);
    document.getElementById('modal').classList.add('hidden');
    document.body.style.overflow = '';
  });
}

// ─── Open README in Side Panel ─────────────────────────────────
async function openReadme(state) {
  const stateColor = {
    draft: 'bg-draft', backlog: 'bg-backlog',
    coding: 'bg-coding', done: 'bg-done'
  };
  const stateBadge = {
    draft: 'bg-draft-light text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    backlog: 'bg-backlog-light text-neutral-700 dark:bg-blue-950 dark:text-blue-300',
    coding: 'bg-coding-light text-neutral-700 dark:bg-amber-950 dark:text-amber-300',
    done: 'bg-done-light text-neutral-700 dark:bg-green-950 dark:text-green-300'
  };
  try {
    const res = await fetch(`../${state}/README.md`);
    if (!res.ok) return;
    const text = await res.text();

    openPlanFile = null;
    document.getElementById('modal-title').textContent = state.charAt(0).toUpperCase() + state.slice(1);
    document.getElementById('modal-state-dot').className = `w-3 h-3 rounded-full ${stateColor[state] || 'bg-neutral-400'}`;

    const metaEl = document.getElementById('modal-meta');
    metaEl.innerHTML = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${stateBadge[state] || 'bg-neutral-200 text-neutral-600'}">${state}</span><span class="text-xs">${t('columnRules')}</span>`;

    const authorsEl = document.getElementById('modal-authors');
    authorsEl.innerHTML = '';
    authorsEl.classList.add('hidden');

    const bodyEl = document.getElementById('modal-body');
    bodyEl.innerHTML = marked.parse(text);

    history.replaceState(null, '', `#readme-${state}`);

    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      document.getElementById('modal-backdrop').classList.remove('opacity-0');
      document.getElementById('panel').classList.remove('translate-x-full');
    });
  } catch {
    // Silently ignore fetch errors
  }
}

function openPlanFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash || !allPlans.length) return;
  const plan = allPlans.find(p => planSlug(p.file) === hash);
  if (plan) openModal(plan);
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-backdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
window.addEventListener('hashchange', openPlanFromHash);

// ─── Render Board ────────────────────────────────────────────────
function renderBoard(plans) {
  const grouped = { draft: [], backlog: [], coding: [], done: [] };
  plans.forEach(p => {
    const st = grouped[p.state] !== undefined ? p.state : p.folder;
    if (grouped[st] !== undefined) grouped[st].push(p);
  });

  let total = 0;
  STATES.forEach(state => {
    const col = document.getElementById(`col-${state}`);
    const count = grouped[state].length;
    total += count;
    document.getElementById(`count-${state}`).textContent = count;

    col.innerHTML = '';
    if (count === 0) {
      col.appendChild(createEmptyState());
    } else {
      grouped[state].forEach(plan => col.appendChild(createCard(plan)));
    }
  });

  const countEl = document.getElementById('total-count');
  const label = total !== 1 ? (strings.planMany || 'plans').replace('{total}', '') : (strings.planOne || 'plan').replace('{total}', '');
  const countHtml = `${total}&nbsp;<span style="opacity:0.5">${label.trim()}</span>`;
  countEl.innerHTML = countHtml;
  countEl.classList.remove('hidden');

  // Mobile: show count in second row and ensure row is visible
  const mobileCount = document.getElementById('total-count-mobile');
  if (mobileCount) {
    mobileCount.innerHTML = countHtml;
    document.getElementById('project-title-row').classList.remove('hidden');
  }
}

// ─── Fingerprint ──────────────────────────────────────────────────
function buildFingerprint(plans) {
  return plans.map(p => p.file + ':' + p.raw.length + ':' + (p.progress ? p.progress.checked : 0)).join('|');
}

// ─── Refresh ────────────────────────────────────────────────────
async function refresh() {
  try {
    const plans = await fetchPlans();
    const fp = buildFingerprint(plans);
    if (fp === plansFingerprint) return;

    plansFingerprint = fp;
    allPlans = plans;
    renderBoard(plans);

    // If a plan is open in the side panel, refresh its content
    if (openPlanFile) {
      const updated = plans.find(p => p.file === openPlanFile);
      if (updated) openModal(updated);
    }
  } catch {
    // Silently ignore polling errors
  }
}

// ─── Project Title ──────────────────────────────────────────────
function formatTitle(name) {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function detectProjectTitle() {
  // 1. Try package.json
  try {
    const res = await fetch('../../package.json');
    if (res.ok) {
      const pkg = await res.json();
      if (pkg.name) return formatTitle(pkg.name);
    }
  } catch {}

  // 2. Extract from URL path (parent of workplans/)
  const parts = window.location.pathname.split('/').filter(Boolean);
  const wpIdx = parts.lastIndexOf('workplans');
  if (wpIdx > 0) return formatTitle(decodeURIComponent(parts[wpIdx - 1]));

  return null;
}

// ─── Init ────────────────────────────────────────────────────────
async function init() {
  try {
    if (window.location.protocol === 'file:') {
      const fullPath = decodeURIComponent(window.location.pathname);
      const wpPath = fullPath.substring(0, fullPath.lastIndexOf('/progress/'));
      const codeEl = document.querySelector('.error-code');
      if (codeEl && wpPath) {
        codeEl.dataset.clipboard = `cd "${wpPath}" && python3 -m http.server`;
      }
      throw new Error('file:// protocol is not supported — use a local server');
    }
    const plans = await fetchPlans();
    allPlans = plans;
    plansFingerprint = buildFingerprint(plans);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('board').classList.remove('hidden');
    renderBoard(plans);
    openPlanFromHash();

    // Update header with project title
    const projectTitle = await detectProjectTitle();
    if (projectTitle) {
      document.getElementById('project-title').textContent = projectTitle;
      document.getElementById('project-title-row').classList.remove('hidden');
      const inlineEl = document.getElementById('project-title-inline');
      inlineEl.textContent = projectTitle;
      inlineEl.classList.remove('hidden');
      inlineEl.classList.add('visible');
    }

    // Start live polling
    document.getElementById('live-indicator').classList.remove('hidden');
    setInterval(refresh, POLL_INTERVAL);
  } catch (err) {
    console.error('Failed to load plans:', err);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
  }
}

init();
