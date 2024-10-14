import Block from '../../framework/Block';
import { Link } from '../link/Link';

export class Footer extends Block {
  constructor() {
    super({
      LinkCreate: new Link({
        href: '#',
        datapage: 'createQuestionnaire',
        text: 'Create Questionnaire',
        onClick: (event: Event) => {
          console.log('CLICK');
          event.preventDefault();
          event.stopPropagation();
        },
      }),
      LinkAnswer: new Link({
        href: '#',
        datapage: 'createQuestionnaire',
        text: 'Create Questionnaire',
      }),
    });
  }

  override render(): string {
    return `<footer class="footer">
        {{{ LinkCreate }}}
        {{{ LinkAnswer }}}
    </footer>`;
  }
}
