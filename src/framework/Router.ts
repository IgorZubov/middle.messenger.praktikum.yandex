import Route from './Route';
import type { BlockClass } from './Route';
import type { BlockOwnProps } from './Block';

type NotFoundCallback = (pathname: string) => void;

export default class Router {
  private static instance: Router | null = null;

  private routes: Route<any>[] = [];

  private history: History = window.history;

  private currentRoute: Route<any> | null = null;

  private rootQuery = '#app';

  private notFoundCallback: NotFoundCallback | null = null;

  constructor(rootQuery = '#app') {
    if (Router.instance) {
      return Router.instance;
    }

    this.rootQuery = rootQuery;
    Router.instance = this;
  }

  use<P extends BlockOwnProps>(pathname: string, block: BlockClass<P>, blockProps?: P): this {
    const route = new Route<P>(pathname, block, { rootQuery: this.rootQuery, blockProps });
    this.routes.push(route);
    return this;
  }

  /** Called when the current pathname has no registered route. */
  onNotFound(callback: NotFoundCallback): this {
    this.notFoundCallback = callback;
    return this;
  }

  private handlePopState = () => {
    this.onRoute(window.location.pathname);
  };

  start(): void {
    // Removing first keeps a single handler if start() is called twice.
    window.removeEventListener('popstate', this.handlePopState);
    window.addEventListener('popstate', this.handlePopState);

    this.onRoute(window.location.pathname);
  }

  /** Stops listening to history changes. */
  stop(): void {
    window.removeEventListener('popstate', this.handlePopState);
  }

  go(pathname: string): void {
    this.history.pushState({}, '', pathname);
    this.onRoute(pathname);
  }

  /** Like go(), but replaces the current history entry (useful for redirects). */
  replace(pathname: string): void {
    this.history.replaceState({}, '', pathname);
    this.onRoute(pathname);
  }

  back(): void {
    this.history.back();
  }

  forward(): void {
    this.history.forward();
  }

  getRoute(pathname: string): Route<any> | undefined {
    return this.routes.find(route => route.match(pathname));
  }

  private onRoute(pathname: string): void {
    const route = this.getRoute(pathname);
    if (!route) {
      this.notFoundCallback?.(pathname);
      return;
    }

    if (this.currentRoute && this.currentRoute !== route) {
      this.currentRoute.leave();
    }

    this.currentRoute = route;
    route.render();
  }
}
