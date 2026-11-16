import { isEqual } from '../utils/isEqual';
import { render } from '../utils/renderDOM';
import type Block from './Block';
import type { BlockOwnProps } from './Block';

export type BlockClass<P extends BlockOwnProps = BlockOwnProps> = new (props?: P) => Block<P>;

export interface RouteProps<P extends BlockOwnProps = BlockOwnProps> {
  rootQuery: string;
  /** Props passed to the page block when it is created. */
  blockProps?: P;
}

export default class Route<P extends BlockOwnProps = BlockOwnProps> {
  private pathname: string;

  private blockClass: BlockClass<P>;

  private block: Block<P> | null = null;

  private props: RouteProps<P>;

  constructor(pathname: string, view: BlockClass<P>, props: RouteProps<P>) {
    this.pathname = pathname;
    this.blockClass = view;
    this.props = props;
  }

  navigate(pathname: string): void {
    if (this.match(pathname)) {
      this.render();
    }
  }

  leave(): void {
    this.block?.hide();
  }

  match(pathname: string): boolean {
    return isEqual(pathname, this.pathname);
  }

  /** The block is created lazily on the first visit and reused afterwards. */
  render(): void {
    if (!this.block) {
      this.block = new this.blockClass(this.props.blockProps);
      render(this.props.rootQuery, this.block);
      return;
    }

    this.block.show();
  }
}
