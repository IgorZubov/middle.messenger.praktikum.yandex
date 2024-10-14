import { Footer } from '../../components/footer/Footer';
import Block from '../../framework/Block';
export class AnswerPage extends Block {
  constructor() {
    
    super({
      Footer: new Footer(),
    });
  }

  override render() {
    return `
    <div class="app">
      <h1>Answer Questionnaire</h1>
      {{{ Footer }}}
    </div>`;
  }
}
