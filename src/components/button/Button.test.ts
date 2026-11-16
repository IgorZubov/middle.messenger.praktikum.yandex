import { beforeAll, describe, expect, it, vi } from 'vitest';
import Button from './Button';
import Block from '../../framework/Block';
import type { BlockOwnProps } from '../../framework/Block';
import { registerComponent } from '../../framework/ComponentRegistry';

describe('Button', () => {
  const render = (props: ConstructorParameters<typeof Button>[0] = {}) =>
    new Button(props).element() as HTMLButtonElement;

  it('is a Block registered under the "Button" name', () => {
    expect(new Button()).toBeInstanceOf(Block);
    expect(Button.componentName).toBe('Button');
  });

  it('renders a <button> with the button class', () => {
    const el = render();
    expect(el.tagName).toBe('BUTTON');
    expect(el.classList.contains('button')).toBe(true);
  });

  it('renders the id and text props', () => {
    const el = render({ id: 'save', text: 'Save' });
    expect(el.id).toBe('save');
    expect(el.textContent).toBe('Save');
  });

  it('is enabled by default and disabled when disabled=true', () => {
    expect(render().disabled).toBe(false);
    expect(render({ disabled: false }).disabled).toBe(false);
    expect(render({ disabled: true }).disabled).toBe(true);
  });

  it('updates text and disabled state through setProps', () => {
    const button = new Button({ text: 'Send', disabled: true });
    button.element();

    button.setProps({ text: 'Sending…', disabled: false });

    const el = button.element() as HTMLButtonElement;
    expect(el.textContent).toBe('Sending…');
    expect(el.disabled).toBe(false);
  });

  describe('inside a parent template', () => {
    interface ToolbarProps extends BlockOwnProps {
      locked?: boolean;
      onSave?: () => void;
    }

    class Toolbar extends Block<ToolbarProps> {
      protected template = `
        <div class="toolbar">
          {{Button id="save" text="Save" disabled=locked ref="save"}}
        </div>
      `;

      protected events = {
        click: (e: Event) => {
          if ((e.target as HTMLElement).id === 'save') {
            this.props.onSave?.();
          }
        },
      };

      get saveButton() {
        return this.refs.save as HTMLButtonElement;
      }
    }

    beforeAll(() => {
      registerComponent(Button);
    });

    it('is rendered in place of the {{Button}} helper', () => {
      const toolbar = new Toolbar();
      const el = toolbar.element();

      expect(el?.querySelector('button#save')?.textContent).toBe('Save');
      expect(toolbar.saveButton).toBe(el?.querySelector('button#save'));
    });

    it('takes props from the parent and re-renders with it', () => {
      const toolbar = new Toolbar({ locked: true });
      toolbar.element();
      expect(toolbar.saveButton.disabled).toBe(true);

      toolbar.setProps({ locked: false });
      expect(toolbar.saveButton.disabled).toBe(false);
    });

    it('lets the parent handle its clicks', () => {
      const onSave = vi.fn();
      const toolbar = new Toolbar({ onSave });

      toolbar.element();
      toolbar.saveButton.click();

      expect(onSave).toHaveBeenCalledOnce();
    });

    it('does not fire clicks while disabled', () => {
      const onSave = vi.fn();
      const toolbar = new Toolbar({ locked: true, onSave });
      toolbar.element();

      toolbar.saveButton.click();

      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
