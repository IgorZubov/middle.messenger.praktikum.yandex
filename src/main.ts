import './styles/main.pcss';

interface AppEntry {
  title: string;
  load: () => Promise<{ default: new () => { render(): void } }>;
}

/**
 * Sprint 1 → sprint 2: each stage of the transition is a separate app.
 * Pick one with ?app=<name>, e.g. /?app=sprint1
 */
const apps: Record<string, AppEntry> = {
  sprint1: { title: 'Sprint 1 · partials', load: () => import('./legacy/App.js') },
  formLite: { title: 'Block · no children', load: () => import('./demos/AppWithFormLite') },
};

const DEFAULT_APP = 'sprint1';

const requested = new URLSearchParams(window.location.search).get('app') ?? DEFAULT_APP;
const current = requested in apps ? requested : DEFAULT_APP;

const switcher = document.getElementById('app-switch')!;
Object.entries(apps).forEach(([name, { title }]) => {
  const link = document.createElement('a');
  link.href = name === DEFAULT_APP ? '/' : `/?app=${name}`;
  link.textContent = title;
  if (name === current) {
    link.setAttribute('aria-current', 'page');
  }
  switcher.appendChild(link);
});

apps[current].load().then(({ default: App }) => {
  const app = new App();
  app.render();
});
