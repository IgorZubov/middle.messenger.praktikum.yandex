import type Block from '../framework/Block';
import type { BlockOwnProps } from '../framework/Block';

/**
 * Appends the block's element to the root. The root is not cleared:
 * every route keeps its own element and is shown or hidden by the router.
 */
export function render<P extends BlockOwnProps>(rootQuery: string, block: Block<P>): Element {
  const root = document.querySelector(rootQuery);
  if (!root) {
    throw new Error(`Root element "${rootQuery}" not found`);
  }
  const element = block.element();
  if (!element) {
    throw new Error('Block has no element to render');
  }
  root.appendChild(element);
  return root;
}
