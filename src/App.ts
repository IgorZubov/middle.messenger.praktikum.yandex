import CreatePage from './pages/createPage/CreatePage';
import AnswerPage from './pages/answerPage/AnswerPage';
import { mockQuestions } from './mockData';
import Router from './framework/Router';
import { registerComponent } from './framework/ComponentRegistry';
import './helpers/handlebarsHelpers';

// Register components (sprint 1 registered partials here)
import Input from './components/input/Input';
import Button from './components/button/Button';
import Select from './components/select/Select';
import ErrorMessage from './components/errorMessage/ErrorMessage';
import Link from './components/link/Link';
import Label from './components/label/Label';
import Footer from './components/footer/Footer';

registerComponent(Input);
registerComponent(Button);
registerComponent(Select);
registerComponent(ErrorMessage);
registerComponent(Link);
registerComponent(Label);
registerComponent(Footer);

export default class App {
  private router = new Router('#app');

  constructor() {
    const navigate = (path: string) => this.router.go(path);

    this.router
      .use('/', CreatePage, {
        onNavigate: navigate,
        onCreateQuestionnaire: () => this.router.go('/answers'),
      })
      .use('/answers', AnswerPage, {
        questions: mockQuestions,
        answerOptions: ['Yes', 'No', 'Maybe'],
        onNavigate: navigate,
        onSubmit: () => this.submitAnswers(),
      })
      .onNotFound(() => this.router.replace('/'));
  }

  render() {
    this.router.start();
  }

  private submitAnswers() {
    alert('Answers submitted!');
  }
}
