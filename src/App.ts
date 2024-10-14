import './helpers/handlebarsHelpers';
import { AnswerPage } from './pages/answerPage/answerPage';

interface AppState {
  currentPage: string;
  questions: string[];
  answers: string[];
}

export default class App {
  private state: AppState;

  private appElement: HTMLElement | null;

  constructor() {
    this.state = {
      currentPage: 'createQuestionnaire',
      questions: [],
      answers: [],
    };
    this.appElement = document.getElementById('app');
  }

  render(): string {
    if (this.state.currentPage === 'createQuestionnaire') {
      const answerPage = new AnswerPage();
      console.log(answerPage.getContent());
      if (this.appElement) {
        this.appElement.replaceWith(answerPage.getContent());
      }
    }
    return '';
  }

  changePage(page: string): void {
    this.state.currentPage = page;
    this.render();
  }

  addQuestion(): void {
    const questionInput = document.getElementById('question-input') as HTMLInputElement;
    if (questionInput.value.trim()) {
      this.state.questions.push(questionInput.value);
      questionInput.value = '';
      this.render();
    }
  }

  createQuestionnaire(): void {
    if (this.state.questions.length > 0) {
      this.state.currentPage = 'answerQuestionnaire';
      this.render();
    }
  }

  submitAnswers(): void {
    alert('Answers submitted!');
  }
}
