import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Block from './Block';
import type { BlockOwnProps } from './Block';
import type RouterType from './Router';

interface PageProps extends BlockOwnProps {
  title?: string;
}

function makePage(className: string) {
  class Page extends Block<PageProps> {
    static created = 0;

    protected template = `<section class="${className}">{{title}}</section>`;

    constructor(props: PageProps = {}) {
      super(props);
      Page.created++;
    }
  }
  return Page;
}

const page = (selector: string) => document.querySelector<HTMLElement>(`#app ${selector}`);
const isVisible = (el: HTMLElement | null) => el !== null && el.style.display !== 'none';
const nextPopState = () => new Promise(resolve => window.addEventListener('popstate', resolve, { once: true }));

describe('Router', () => {
  let Router: typeof RouterType;
  let router: RouterType;
  let HomePage: ReturnType<typeof makePage>;
  let ChatPage: ReturnType<typeof makePage>;

  beforeEach(async () => {
    // Router is a singleton: load a fresh module for every test.
    vi.resetModules();
    ({ default: Router } = await import('./Router'));

    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, '', '/');

    HomePage = makePage('home');
    ChatPage = makePage('chat');
    router = new Router('#app');
  });

  afterEach(() => {
    router.stop();
  });

  describe('singleton', () => {
    it('returns the same instance for every new Router()', () => {
      expect(new Router('#other')).toBe(router);
    });
  });

  describe('use()', () => {
    it('returns the router for chaining', () => {
      expect(router.use('/', HomePage).use('/chat', ChatPage)).toBe(router);
    });

    it('registers routes that getRoute() can find', () => {
      router.use('/', HomePage).use('/chat', ChatPage);

      expect(router.getRoute('/chat')?.match('/chat')).toBe(true);
      expect(router.getRoute('/missing')).toBeUndefined();
    });

    it('does not create the page until the route is visited', () => {
      router.use('/', HomePage).use('/chat', ChatPage);
      router.start();

      expect(HomePage.created).toBe(1);
      expect(ChatPage.created).toBe(0);
    });
  });

  describe('start()', () => {
    it('renders the page for the current location into the root', () => {
      window.history.replaceState({}, '', '/chat');
      router.use('/', HomePage).use('/chat', ChatPage).start();

      expect(page('.chat')).not.toBeNull();
      expect(page('.home')).toBeNull();
    });

    it('passes the props given to use() to the page', () => {
      router.use('/', HomePage, { title: 'Welcome' }).start();
      expect(page('.home')?.textContent).toBe('Welcome');
    });

    it('calls onNotFound with the pathname when nothing matches', () => {
      const notFound = vi.fn();
      window.history.replaceState({}, '', '/nope');

      router.use('/', HomePage).onNotFound(notFound).start();

      expect(notFound).toHaveBeenCalledWith('/nope');
      expect(document.querySelector('#app')?.children).toHaveLength(0);
    });

    it('throws a clear error when the root element is missing', () => {
      document.body.innerHTML = '';
      router.use('/', HomePage);
      expect(() => router.start()).toThrow('Root element "#app" not found');
    });
  });

  describe('go()', () => {
    beforeEach(() => {
      router.use('/', HomePage).use('/chat', ChatPage).start();
    });

    it('pushes a history entry and updates the URL', () => {
      const length = window.history.length;
      router.go('/chat');

      expect(window.location.pathname).toBe('/chat');
      expect(window.history.length).toBe(length + 1);
    });

    it('shows the new page and hides the previous one', () => {
      router.go('/chat');

      expect(isVisible(page('.chat'))).toBe(true);
      expect(isVisible(page('.home'))).toBe(false);
    });

    it('reuses the existing page when returning to a route', () => {
      router.go('/chat');
      const homeElement = page('.home');
      router.go('/');

      expect(HomePage.created).toBe(1);
      expect(page('.home')).toBe(homeElement);
      expect(isVisible(page('.home'))).toBe(true);
      expect(isVisible(page('.chat'))).toBe(false);
    });

    it('keeps the page visible when navigating to the current route', () => {
      router.go('/');
      expect(isVisible(page('.home'))).toBe(true);
    });

    it('keeps one element per route in the root', () => {
      router.go('/chat');
      router.go('/');
      router.go('/chat');

      expect(document.querySelector('#app')?.children).toHaveLength(2);
    });
  });

  describe('replace()', () => {
    it('navigates without adding a history entry', () => {
      router.use('/', HomePage).use('/chat', ChatPage).start();
      const length = window.history.length;

      router.replace('/chat');

      expect(window.location.pathname).toBe('/chat');
      expect(window.history.length).toBe(length);
      expect(isVisible(page('.chat'))).toBe(true);
    });

    it('can redirect unknown paths from onNotFound', () => {
      window.history.replaceState({}, '', '/unknown');
      router
        .use('/', HomePage)
        .onNotFound(() => router.replace('/'))
        .start();

      expect(window.location.pathname).toBe('/');
      expect(page('.home')).not.toBeNull();
    });
  });

  describe('popstate listener', () => {
    it('start() called twice handles each popstate once', () => {
      const onRoute = vi.spyOn(router as unknown as { onRoute: (p: string) => void }, 'onRoute');
      router.use('/', HomePage).start();
      router.start();
      onRoute.mockClear();

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(onRoute).toHaveBeenCalledOnce();
    });

    it('stop() stops reacting to popstate', () => {
      router.use('/', HomePage).use('/chat', ChatPage).start();
      router.stop();
      window.history.pushState({}, '', '/chat');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(page('.chat')).toBeNull();
    });
  });

  describe('browser history', () => {
    beforeEach(() => {
      router.use('/', HomePage).use('/chat', ChatPage).start();
    });

    it('back() delegates to window.history.back()', () => {
      const back = vi.spyOn(window.history, 'back');
      router.back();
      expect(back).toHaveBeenCalledOnce();
    });

    it('forward() delegates to window.history.forward()', () => {
      const forward = vi.spyOn(window.history, 'forward');
      router.forward();
      expect(forward).toHaveBeenCalledOnce();
    });

    it('renders the previous page when the user goes back (popstate)', async () => {
      router.go('/chat');

      const popped = nextPopState();
      router.back();
      await popped;

      expect(window.location.pathname).toBe('/');
      expect(isVisible(page('.home'))).toBe(true);
      expect(isVisible(page('.chat'))).toBe(false);
    });

    it('renders the next page when the user goes forward again', async () => {
      router.go('/chat');

      let popped = nextPopState();
      router.back();
      await popped;
      expect(isVisible(page('.chat'))).toBe(false);

      popped = nextPopState();
      router.forward();
      await popped;

      expect(window.location.pathname).toBe('/chat');
      expect(isVisible(page('.chat'))).toBe(true);
      expect(isVisible(page('.home'))).toBe(false);
    });
  });
});
