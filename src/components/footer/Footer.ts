//@ts-nocheck
import Block from '../../framework/Block';
import { Link } from '../link/Link';

export class Footer extends Block {
  constructor(props: any) {
    super({
      ...props,
      LinkCreate: new Link({
        href: '#',
        datapage:'createQuestionnaire',
        text:'Create Questionnaire',
        onClick: (event) => {
          console.log('CLICK');
          event.preventDefault();
          event.stopPropagation();
        },
      }),
      LinkAnswer: new Link({
        href: '#',
        datapage:'createQuestionnaire',
        text:'Create Questionnaire',
      }),
    });
  }

  override render() {
    return `<footer class="footer">
  {{{ LinkCreate }}}
  {{{ LinkAnswer }}}
</footer>`;
  }
}
