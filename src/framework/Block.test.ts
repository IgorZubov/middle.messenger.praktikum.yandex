import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Block from './Block';
import type { BlockOwnProps } from './Block';
import { registerComponent } from './ComponentRegistry';

// --- test components -------------------------------------------------------

interface CardProps extends BlockOwnProps {
  title?: string;
  text?: string;
  onSelect?: () => void;
}

/** A plain Block subclass that records its lifecycle calls. */
class Card extends Block<CardProps> {
  mounted = 0;

  unmounted = 0;

  protected template = `
    <article class="card">
      <h2 ref="title">{{title}}</h2>
      <p>{{text}}</p>
    </article>
  `;

  protected events = {
    click: () => this.props.onSelect?.(),
  };

  protected componentDidMount() {
    this.mounted++;
  }

  protected componentWillUnmount() {
    this.unmounted++;
  }

  get titleRef() {
    return this.refs.title;
  }
}

/** A child component registered as a Handlebars helper. */
class Badge extends Block<{ label?: string } & BlockOwnProps> {
  static componentName = 'TestBadge';

  static instances: Badge[] = [];

  unmounted = 0;

  protected template = `<span class="badge">{{label}}</span>`;

  constructor(props: { label?: string } = {}) {
    super(props);
    Badge.instances.push(this);
  }

  protected componentWillUnmount() {
    this.unmounted++;
  }
}

interface ProfileProps extends BlockOwnProps {
  name?: string;
  role?: string;
}

class Profile extends Block<ProfileProps> {
  protected template = `
    <div class="profile">
      <b>{{name}}</b>
      {{TestBadge label=role ref="badge"}}
    </div>
  `;

  get badgeRef() {
    return this.refs.badge;
  }
}

interface FeedProps extends BlockOwnProps {
  loading?: boolean;
  items?: string[];
  error?: string;
}

/** A Block that loads data asynchronously, like a page talking to an API. */
class Feed extends Block<FeedProps> {
  protected template = `
    <div class="feed">
      {{#if loading}}<span class="loader">Loading…</span>{{/if}}
      {{#if error}}<p class="error">{{error}}</p>{{/if}}
      {{#each items}}<p class="item">{{this}}</p>{{/each}}
    </div>
  `;

  private api: () => Promise<string[]>;

  constructor(api: () => Promise<string[]>) {
    super({ loading: false, items: [] });
    this.api = api;
  }

  async load() {
    this.setProps({ loading: true, error: undefined });
    try {
      this.setProps({ items: await this.api(), loading: false });
    } catch {
      this.setProps({ error: 'Failed to load', loading: false });
    }
  }
}

const html = (el: Element | null) => el?.outerHTML.replace(/\s+/g, ' ');

// --- tests -----------------------------------------------------------------

describe('Block', () => {
  beforeAll(() => {
    registerComponent(Badge);
  });

  beforeEach(() => {
    Badge.instances = [];
    document.body.innerHTML = '';
  });

  describe('rendering', () => {
    it('is a Block instance', () => {
      expect(new Card()).toBeInstanceOf(Block);
    });

    it('does not render until element() is requested', () => {
      const card = new Card({ title: 'Hi' });
      expect(card.mounted).toBe(0);

      card.element();
      expect(card.mounted).toBe(1);
    });

    it('renders the template root element with props', () => {
      const el = new Card({ title: 'Title', text: 'Body' }).element();

      expect(el?.tagName).toBe('ARTICLE');
      expect(el?.querySelector('h2')?.textContent).toBe('Title');
      expect(el?.querySelector('p')?.textContent).toBe('Body');
    });

    it('returns the same element on repeated calls', () => {
      const card = new Card();
      expect(card.element()).toBe(card.element());
    });

    it('escapes HTML coming from props', () => {
      const el = new Card({ title: '<img src=x onerror=alert(1)>' }).element();

      expect(el?.querySelector('img')).toBeNull();
      expect(el?.querySelector('h2')?.textContent).toBe('<img src=x onerror=alert(1)>');
    });
  });

  describe('setProps()', () => {
    it('re-renders with the new value', () => {
      const card = new Card({ title: 'Old' });
      card.element();

      card.setProps({ title: 'New' });

      expect(card.element()?.querySelector('h2')?.textContent).toBe('New');
      expect(card.mounted).toBe(2);
    });

    it('keeps props that were not passed', () => {
      const card = new Card({ title: 'Title', text: 'Body' });
      card.element();

      card.setProps({ title: 'Changed' });

      expect(card.element()?.querySelector('p')?.textContent).toBe('Body');
    });

    it('does not re-render when every value is unchanged', () => {
      const card = new Card({ title: 'Same', text: 'Same' });
      card.element();

      card.setProps({ title: 'Same', text: 'Same' });

      expect(card.mounted).toBe(1);
    });

    it('re-renders when only one of several values changed', () => {
      const card = new Card({ title: 'Same', text: 'Old' });
      card.element();

      card.setProps({ title: 'Same', text: 'New' });

      expect(card.element()?.querySelector('p')?.textContent).toBe('New');
    });

    it('re-renders when a new prop is added', () => {
      const card = new Card();
      card.element();

      card.setProps({ title: 'Added' });

      expect(card.element()?.querySelector('h2')?.textContent).toBe('Added');
    });

    it('replaces the old element in the page', () => {
      const card = new Card({ title: 'Old' });
      document.body.appendChild(card.element()!);
      const oldElement = card.element();

      card.setProps({ title: 'New' });

      expect(document.body.contains(oldElement)).toBe(false);
      expect(document.body.firstElementChild).toBe(card.element());
    });
  });

  describe('lifecycle', () => {
    it('calls componentDidMount after every render', () => {
      const card = new Card({ title: 'a' });
      card.element();
      card.setProps({ title: 'b' });
      card.setProps({ title: 'c' });

      expect(card.mounted).toBe(3);
    });

    it('calls componentWillUnmount before a re-render, but not on the first render', () => {
      const card = new Card({ title: 'a' });
      card.element();
      expect(card.unmounted).toBe(0);

      card.setProps({ title: 'b' });
      expect(card.unmounted).toBe(1);
    });

    it('unmounts child components when the parent re-renders', () => {
      const profile = new Profile({ name: 'Ann', role: 'admin' });
      profile.element();
      const [firstBadge] = Badge.instances;

      profile.setProps({ name: 'Bob' });

      expect(firstBadge.unmounted).toBe(1);
    });
  });

  describe('events', () => {
    it('attaches listeners from the events map to the root element', () => {
      const onSelect = vi.fn();
      const el = new Card({ onSelect }).element() as HTMLElement;

      el.click();

      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('receives events bubbling up from inner elements', () => {
      const onSelect = vi.fn();
      const el = new Card({ title: 'x', onSelect }).element() as HTMLElement;

      el.querySelector('h2')?.click();

      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('moves listeners to the new element after a re-render (no duplicates)', () => {
      const onSelect = vi.fn();
      const card = new Card({ title: 'a', onSelect });
      const oldElement = card.element() as HTMLElement;

      card.setProps({ title: 'b' });
      card.setProps({ title: 'c' });
      oldElement.click();
      (card.element() as HTMLElement).click();

      expect(onSelect).toHaveBeenCalledOnce();
    });
  });

  describe('refs', () => {
    it('collects elements marked with ref and removes the attribute', () => {
      const card = new Card({ title: 'Ref' });
      card.element();

      expect(card.titleRef?.tagName).toBe('H2');
      expect(card.titleRef?.hasAttribute('ref')).toBe(false);
    });

    it('points refs at the new elements after a re-render', () => {
      const card = new Card({ title: 'a' });
      card.element();
      card.setProps({ title: 'b' });

      expect(card.titleRef?.textContent).toBe('b');
      expect(card.element()?.contains(card.titleRef!)).toBe(true);
    });
  });

  describe('child components', () => {
    it('replaces the placeholder with the child element', () => {
      const el = new Profile({ name: 'Ann', role: 'admin' }).element();

      expect(el?.querySelector('[data-component-hbs-id]')).toBeNull();
      expect(el?.querySelector('.badge')?.textContent).toBe('admin');
    });

    it('passes hash arguments to the child as props', () => {
      new Profile({ role: 'editor' }).element();
      expect(Badge.instances[0].element()?.textContent).toBe('editor');
    });

    it('exposes a child via ref', () => {
      const profile = new Profile({ role: 'admin' });
      profile.element();

      expect(profile.badgeRef).toBe(Badge.instances[0].element());
    });

    it('creates fresh children with new props on re-render', () => {
      const profile = new Profile({ role: 'admin' });
      profile.element();

      profile.setProps({ role: 'guest' });

      expect(Badge.instances).toHaveLength(2);
      expect(html(profile.element())).toContain('<span class="badge">guest</span>');
    });
  });

  describe('show() / hide()', () => {
    it('hides and shows the element', () => {
      const card = new Card();
      const el = card.element() as HTMLElement;

      card.hide();
      expect(el.style.display).toBe('none');

      card.show();
      expect(el.style.display).toBe('');
    });

    it('show() renders the block if it was not rendered yet', () => {
      const card = new Card({ title: 'Lazy' });
      card.show();
      expect(card.mounted).toBe(1);
    });

    it('hide() before rendering does nothing', () => {
      const card = new Card();
      expect(() => card.hide()).not.toThrow();
      expect(card.mounted).toBe(0);
    });
  });

  describe('async data', () => {
    const items = (feed: Feed) => Array.from(feed.element()!.querySelectorAll('.item')).map(p => p.textContent);
    const loader = (feed: Feed) => feed.element()!.querySelector('.loader');
    const error = (feed: Feed) => feed.element()!.querySelector('.error');

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows a loader while waiting and the items afterwards', async () => {
      vi.useFakeTimers();
      const feed = new Feed(() => new Promise(resolve => setTimeout(() => resolve(['a', 'b']), 1000)));
      feed.element();

      const loading = feed.load();
      expect(loader(feed)).not.toBeNull();
      expect(items(feed)).toEqual([]);

      await vi.advanceTimersByTimeAsync(1000);
      await loading;

      expect(loader(feed)).toBeNull();
      expect(items(feed)).toEqual(['a', 'b']);
    });

    it('shows an error when loading fails and clears it on retry', async () => {
      const api = vi.fn()
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValueOnce(['ok']);
      const feed = new Feed(api);
      feed.element();

      await feed.load();
      expect(error(feed)?.textContent).toBe('Failed to load');
      expect(loader(feed)).toBeNull();

      await feed.load();
      expect(error(feed)).toBeNull();
      expect(items(feed)).toEqual(['ok']);
    });
  });
});
