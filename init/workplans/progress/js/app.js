// ─── Constants ───────────────────────────────────────────────────
const POLL_INTERVAL = 1000;
const STATES = ['draft', 'backlog', 'doing', 'done'];
const STATE_COLORS = {
  draft:   'bg-draft',
  backlog: 'bg-backlog',
  doing:   'bg-doing',
  done:    'bg-done',
};
const STATE_BADGE = {
  draft:   'bg-draft-light text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
  backlog: 'bg-backlog-light text-neutral-700 dark:bg-blue-950 dark:text-blue-300',
  doing:   'bg-doing-light text-neutral-700 dark:bg-amber-950 dark:text-amber-300',
  done:    'bg-done-light text-neutral-700 dark:bg-green-950 dark:text-green-300',
};
let layoutMode = null;

// ─── i18n ─────────────────────────────────────────────────────
const I18N = {
  en: {
    pageTitle: 'Workplans Progress',
    headerTitle: 'Workplans',
    headerBadge: 'Progress',
    colDraft: 'Draft',    colBacklog: 'Backlog',
    colDoing: 'Doing',  colDone: 'Done',
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
    colDoing: 'Doing',  colDone: 'Done',
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
  return { icon: null, name: modelStr.trim(), mono: false, generic: true };
}

const GENERIC_MODEL_SVG = `<svg class="w-3.5 h-3.5 flex-shrink-0 text-neutral-400 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`;

function modelIconHtml(m, extraClass) {
  if (m.generic) return `<span title="${m.name}" class="cursor-default">${GENERIC_MODEL_SVG}</span>`;
  return `<img src="${m.icon}" alt="${m.name}" title="${m.name}" class="w-3.5 h-3.5 flex-shrink-0 ${extraClass || ''} ${m.mono ? 'invert dark:invert-0' : ''}" loading="lazy">`;
}

function getModelIcons(modelStr) {
  if (!modelStr) return [];
  return modelStr.split(',').map(m => getModelIcon(m.trim())).filter(Boolean);
}

// ─── Dark Mode ───────────────────────────────────────────────────
// Default: follow system preference.
// When the user clicks the toggle button, their choice is saved to
// localStorage and overrides the system preference on future loads.
function initTheme() {
  const stored = localStorage.getItem('workplans-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  updateThemeIcons();

  // Follow live system changes when no manual override is stored
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('workplans-theme')) return;
    document.documentElement.classList.toggle('dark', e.matches);
    updateThemeIcons();
  });
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  document.getElementById('icon-sun').classList.toggle('hidden', !isDark);
  document.getElementById('icon-moon').classList.toggle('hidden', isDark);
}

// ─── Directory Listing Parser ────────────────────────────────────
function parseMdFilesFromListing(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  const files = [];
  links.forEach(a => {
    const href = decodeURIComponent(a.getAttribute('href') || '');
    if (!href.endsWith('.md')) return;
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
            draft: meta.draft || '',
            backlog: meta.backlog || '',
            doing: meta.doing || '',
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
        draft: meta.draft || '',
        backlog: meta.backlog || '',
        doing: meta.doing || '',
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
  }

  if (layoutMode === 'flat') return fetchPlansFlat();

  const [subfolderPlans, rootPlans] = await Promise.all([
    fetchPlansSubfolders(),
    fetchPlansFlat(),
  ]);
  const seen = new Set(subfolderPlans.map(p => p.file));
  const strayPlans = rootPlans.filter(p => !seen.has(p.file));
  return [...subfolderPlans, ...strayPlans];
}

// ─── Fingerprint ──────────────────────────────────────────────────
function buildFingerprint(plans) {
  return plans.map(p => p.file + ':' + p.state + ':' + p.raw.length + ':' + (p.progress ? p.progress.checked : 0)).join('|');
}

// ─── Comment Processing ─────────────────────────────────────────
function processComments(container) {
  const headings = container.querySelectorAll('h2');
  let commentsH2 = null;
  for (const h of headings) {
    if (h.textContent.trim().toLowerCase() === 'comments') {
      commentsH2 = h;
      break;
    }
  }
  if (!commentsH2) return;

  const siblings = [];
  let node = commentsH2.nextSibling;
  while (node) {
    const next = node.nextSibling;
    if (node.nodeType === 1 && node.tagName === 'H2') break;
    siblings.push(node);
    node = next;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'comments-section';

  let currentBlock = null;
  let currentBody = null;

  for (const el of siblings) {
    if (el.nodeType === 1 && el.tagName === 'H3') {
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
    el.parentNode && el.parentNode.removeChild(el);
  }
  if (currentBlock) wrapper.appendChild(currentBlock);

  commentsH2.insertAdjacentElement('afterend', wrapper);
}

// ─── Project Title ──────────────────────────────────────────────
function formatTitle(name) {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function detectProjectTitle() {
  try {
    const res = await fetch('../../package.json');
    if (res.ok) {
      const pkg = await res.json();
      if (pkg.name) return formatTitle(pkg.name);
    }
  } catch {}

  const parts = window.location.pathname.split('/').filter(Boolean);
  const wpIdx = parts.lastIndexOf('workplans');
  if (wpIdx > 0) return formatTitle(decodeURIComponent(parts[wpIdx - 1]));

  return null;
}

// ─── Alpine Component ────────────────────────────────────────────
document.addEventListener('alpine:init', () => {
  Alpine.data('workplansBoard', () => ({
    // ── Reactive State ──
    appState: 'loading',
    plans: [],
    fingerprint: '',
    modalOpen: false,
    modalPlan: null,
    modalVersion: 0,
    openPlanFile: null,
    openPlanSlug: null,
    projectTitle: null,
    showInfoButtons: true,
    states: STATES,

    // ── Column Helpers ──
    plansForState(state) {
      return this.plans
        .filter(p => {
          const st = STATES.includes(p.state) ? p.state : p.folder;
          return st === state;
        })
        .sort((a, b) => {
          // Sort by the date the plan entered this state, newest first.
          // Plans without a date sink to the bottom.
          const dateA = a[state] || '';
          const dateB = b[state] || '';
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return 0;
        });
    },

    stateColor(state) {
      return STATE_COLORS[state] || 'bg-neutral-400';
    },

    colKey(state) {
      return 'col' + state.charAt(0).toUpperCase() + state.slice(1);
    },

    // ── Card Helpers ──
    planDate(plan) {
      const dt = plan.done || plan.doing || plan.backlog || plan.draft || '';
      return dt.slice(0, 10);
    },

    planTags(plan) {
      if (!plan.tags) return [];
      return plan.tags.split(',').map(s => s.trim()).filter(Boolean);
    },

    stepsLabel(progress) {
      if (!progress) return '';
      return t('steps', { checked: progress.checked, total: progress.total });
    },

    hasModelIcons(modelStr) {
      return getModelIcons(modelStr).length > 0;
    },

    cardModelIconsHtml(modelStr) {
      return getModelIcons(modelStr).map(m => modelIconHtml(m, 'cursor-default')).join('');
    },

    totalCountHtml() {
      const total = this.plans.length;
      const label = total !== 1
        ? (strings.planMany || 'plans').replace('{total}', '')
        : (strings.planOne || 'plan').replace('{total}', '');
      return `${total}&nbsp;<span style="opacity:0.5">${label.trim()}</span>`;
    },

    // ── Modal Helpers ──
    modalMetaHtml() {
      void this.modalVersion;
      const plan = this.modalPlan;
      if (!plan) return '';
      const items = [];

      items.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATE_BADGE[plan.state] || 'bg-neutral-200 text-neutral-600'}">${plan.state}</span>`);

      if (plan._isReadme) {
        items.push(`<span class="text-xs">${t('columnRules')}</span>`);
        return items.join('');
      }

      const mp = plan.progress;
      if (mp) {
        const r = 6, circ = 2 * Math.PI * r;
        const offset = circ - (mp.pct / 100) * circ;
        const color = mp.pct === 100 ? '#22c55e' : '#a3a3a3';
        items.push(`<span class="inline-flex items-center gap-1.5" title="${t('steps', {checked: mp.checked, total: mp.total})}"><span class="text-xs font-medium">${mp.pct}%</span><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="${r}" fill="none" stroke-width="2" class="stroke-neutral-200 dark:stroke-neutral-700"/><circle cx="8" cy="8" r="${r}" fill="none" stroke-width="2" stroke="${color}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 8 8)"/></svg></span>`);
      }

      const date = plan.done || plan.doing || plan.backlog || plan.draft || '';
      if (date) {
        const dateOnly = date.slice(0, 10);
        const time = date.length > 10 ? date.slice(10).replace('T', ' ') : '';
        items.push(`<span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>${dateOnly}${time ? `<span class="opacity-50">${time}</span>` : ''}</span>`);
      }

      if (plan.issue) items.push(`<a href="${plan.issue}" target="_blank" rel="noopener" class="flex items-center gap-1 text-neutral-900 dark:text-neutral-100 underline hover:text-neutral-600 dark:hover:text-neutral-300"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>${t('issue')}</a>`);

      if (plan.tags) {
        plan.tags.split(',').map(s => s.trim()).filter(Boolean).forEach(tag => {
          items.push(`<span class="px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">${tag}</span>`);
        });
      }

      return items.join('');
    },

    modalAuthorsHtml() {
      void this.modalVersion;
      const plan = this.modalPlan;
      if (!plan || plan._isReadme) return '';

      const personIcon = `<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
      const iconsHtml = (ms) => getModelIcons(ms).map(m => modelIconHtml(m)).join('');

      const sameUser = plan.author && plan.assignee && plan.author === plan.assignee;
      const sameModel = plan.author_model && plan.assignee_model && plan.author_model === plan.assignee_model;

      const items = [];
      if (sameUser && sameModel) {
        items.push(`<span class="flex items-center gap-1.5">${personIcon}${plan.author} ${iconsHtml(plan.author_model)}</span>`);
      } else {
        if (plan.author) {
          const authorModels = iconsHtml(plan.author_model);
          const label = plan.assignee ? `<span class="text-neutral-400 dark:text-neutral-600">${t('author')}</span> ` : '';
          items.push(`<span class="flex items-center gap-1.5">${personIcon}${label}${plan.author} ${authorModels}</span>`);
        }
        if (plan.assignee) {
          const assigneeModels = iconsHtml(plan.assignee_model);
          const label = plan.author ? `<span class="text-neutral-400 dark:text-neutral-600">${t('assignee')}</span> ` : '';
          items.push(`<span class="flex items-center gap-1.5">${personIcon}${label}${plan.assignee} ${assigneeModels}</span>`);
        }
      }

      return items.join('<span class="text-neutral-300 dark:text-neutral-700">|</span>');
    },

    modalBodyHtml() {
      void this.modalVersion;
      if (!this.modalPlan) return '';
      return marked.parse(this.modalPlan.body);
    },

    // ── Modal Actions ──
    openModal(plan) {
      this.modalPlan = plan;
      this.openPlanFile = plan.file;
      this.openPlanSlug = planSlug(plan.file);
      this.modalOpen = true;
      history.replaceState(null, '', `#${this.openPlanSlug}`);
      document.body.style.overflow = 'hidden';
    },

    closeModal() {
      this.modalOpen = false;
      this.openPlanFile = null;
      this.openPlanSlug = null;
      history.replaceState(null, '', window.location.pathname + window.location.search);
      document.body.style.overflow = '';
    },

    async openReadme(state) {
      try {
        const res = await fetch(`../${state}/README.md`);
        if (!res.ok) return;
        const text = await res.text();
        this.modalPlan = {
          title: state.charAt(0).toUpperCase() + state.slice(1),
          state,
          body: text,
          file: null,
          progress: null,
          tags: '', author: '', author_model: '',
          assignee: '', assignee_model: '',
          issue: '',
          draft: '', backlog: '', doing: '', done: '',
          _isReadme: true,
        };
        this.openPlanFile = null;
        this.openPlanSlug = null;
        this.modalOpen = true;
        history.replaceState(null, '', `#readme-${state}`);
        document.body.style.overflow = 'hidden';
      } catch {}
    },

    openPlanFromHash() {
      const hash = window.location.hash.slice(1);
      if (!hash || !this.plans.length) return;
      if (hash.startsWith('readme-')) {
        const state = hash.replace('readme-', '');
        if (STATES.includes(state)) this.openReadme(state);
        return;
      }
      const plan = this.plans.find(p => planSlug(p.file) === hash);
      if (plan) this.openModal(plan);
    },

    // ── FLIP Animation ──
    _snapshotPositions() {
      const map = {};
      document.querySelectorAll('[data-plan-file]').forEach(el => {
        const rect = el.getBoundingClientRect();
        const slug = planSlug(el.dataset.planFile);
        map[slug] = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      });
      return map;
    },

    _animateTransitions(oldPositions, newDoneFiles = []) {
      this.$nextTick(() => {
        const doneFileSet = new Set(newDoneFiles);
        let doneColumnFlashed = false;

        document.querySelectorAll('[data-plan-file]').forEach(el => {
          const slug = planSlug(el.dataset.planFile);
          const oldPos = oldPositions[slug];
          const isDoneFlash = doneFileSet.has(el.dataset.planFile);

          if (!oldPos) {
            // New card — cardIn animation plays naturally
            // Flash if it's a new done card (appeared directly in done)
            if (isDoneFlash) {
              if (!doneColumnFlashed) { this._flashDoneColumn(); doneColumnFlashed = true; }
              el.classList.add('card-done-flash');
              el.addEventListener('animationend', () => el.classList.remove('card-done-flash'), { once: true });
            }
            return;
          }

          // Cancel cardIn BEFORE measuring so getBoundingClientRect
          // reflects the true layout position (cardIn applies translateY(8px))
          if (el.getAnimations) el.getAnimations().forEach(a => a.cancel());
          el.classList.remove('card-animate');
          el.style.opacity = '1';

          const newRect = el.getBoundingClientRect();
          const dx = oldPos.left - newRect.left;
          const dy = oldPos.top - newRect.top;

          if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

          const isColumnChange = Math.abs(dx) > 50;

          if (isColumnChange) {
            // Clone the card and animate it above everything with fixed positioning.
            // This avoids touching scroll container overflow which causes scrollbar flicker.
            const clone = el.cloneNode(true);
            clone.setAttribute('x-ignore', '');
            clone.removeAttribute('data-plan-file');
            clone.style.position = 'fixed';
            clone.style.top = newRect.top + 'px';
            clone.style.left = newRect.left + 'px';
            clone.style.width = newRect.width + 'px';
            clone.style.zIndex = '40';
            clone.style.margin = '0';
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);

            // Hide original instantly (bypass transition-all)
            el.style.transition = 'none';
            el.style.opacity = '0';

            const tilt = dx > 0 ? -3 : 3; // lean in direction of movement

            clone.animate([
              { transform: `translate(${dx}px, ${dy}px) rotate(0deg)`, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' },
              { transform: `translate(${dx * 0.4}px, ${dy * 0.4}px) scale(1.03) rotate(${tilt}deg)`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', offset: 0.4 },
              { transform: 'translate(0,0) rotate(0deg)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }
            ], { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }).onfinish = () => {
              if (isDoneFlash) {
                // Flash clone and column when card arrives at done
                if (!doneColumnFlashed) { this._flashDoneColumn(); doneColumnFlashed = true; }
                clone.classList.add('card-done-flash');
                clone.addEventListener('animationend', () => {
                  clone.remove();
                  el.style.opacity = '1';
                  el.offsetHeight;
                  el.style.transition = '';
                }, { once: true });
              } else {
                clone.remove();
                el.style.opacity = '1';
                el.offsetHeight; // force reflow so the change is instant
                el.style.transition = '';
              }
            };
          } else {
            // Same-column shift: smooth slide
            el.animate([
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: 'translate(0,0)' }
            ], { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
          }
        });
      });
    },

    // ── Done Flash ──
    _flashDoneColumn() {
      const col = document.querySelector('[data-state="done"]');
      if (!col) return;
      col.classList.remove('done-flash');
      void col.offsetHeight;
      col.classList.add('done-flash');
      col.addEventListener('animationend', () => col.classList.remove('done-flash'), { once: true });
    },

    _flashDoneCards(files) {
      for (const file of files) {
        const card = document.querySelector(`[data-plan-file="${file}"]`);
        if (!card) continue;
        card.classList.remove('card-done-flash');
        void card.offsetHeight;
        card.classList.add('card-done-flash');
        card.addEventListener('animationend', () => card.classList.remove('card-done-flash'), { once: true });
      }
    },

    // ── Polling ──
    async refresh() {
      try {
        const plans = await fetchPlans();
        const fp = buildFingerprint(plans);
        if (fp === this.fingerprint) return;

        const isDone = (p) => (STATES.includes(p.state) ? p.state : p.folder) === 'done';
        const oldDoneFiles = new Set(this.plans.filter(isDone).map(p => p.file));

        const oldPositions = this._snapshotPositions();

        this.fingerprint = fp;
        this.plans = plans;

        const newDoneFiles = plans.filter(isDone).filter(p => !oldDoneFiles.has(p.file)).map(p => p.file);

        if (this.openPlanSlug) {
          const updated = plans.find(p => planSlug(p.file) === this.openPlanSlug);
          if (updated) {
            this.openPlanFile = updated.file;
            this.modalPlan = updated;
            this.modalVersion++;
          }
        }

        this._animateTransitions(oldPositions, newDoneFiles);
      } catch {}
    },

    // ── Theme ──
    toggleTheme() {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('workplans-theme',
        document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      updateThemeIcons();
    },

    // ── Init ──
    async init() {
      initTheme();

      if (window.location.protocol === 'file:') {
        const fullPath = decodeURIComponent(window.location.pathname);
        const wpPath = fullPath.substring(0, fullPath.lastIndexOf('/progress/'));
        const codeEl = document.querySelector('.error-code');
        if (codeEl && wpPath) {
          codeEl.dataset.clipboard = `cd "${wpPath}" && python3 -m http.server`;
        }
        this.appState = 'error';
        return;
      }

      try {
        const plans = await fetchPlans();
        this.plans = plans;
        this.fingerprint = buildFingerprint(plans);
        this.showInfoButtons = layoutMode !== 'flat';
        this.appState = 'ready';

        document.title = t('pageTitle');
        this.$nextTick(() => this.openPlanFromHash());

        const projectTitle = await detectProjectTitle();
        if (projectTitle) this.projectTitle = projectTitle;

        setInterval(() => this.refresh(), POLL_INTERVAL);
        window.addEventListener('hashchange', () => this.openPlanFromHash());
      } catch (err) {
        console.error('Failed to load plans:', err);
        this.appState = 'error';
      }
    },
  }));
});
