import './helpers/handlebarsHelpers';
import { AnswerPage } from './pages/answerPage/answerPage';
export default class App {
    constructor() {
        this.state = {
            currentPage: 'createQuestionnaire',
            questions: [],
            answers: [],
        };
        this.appElement = document.getElementById('app');
    }
    render() {
        if (this.state.currentPage === 'createQuestionnaire') {
            const answerPage = new AnswerPage();
            console.log(answerPage.getContent());
            if (this.appElement) {
                this.appElement.replaceWith(answerPage.getContent());
            }
        }
        return '';
    }
    changePage(page) {
        this.state.currentPage = page;
        this.render();
    }
    addQuestion() {
        const questionInput = document.getElementById('question-input');
        if (questionInput.value.trim()) {
            this.state.questions.push(questionInput.value);
            questionInput.value = '';
            this.render();
        }
    }
    createQuestionnaire() {
        if (this.state.questions.length > 0) {
            this.state.currentPage = 'answerQuestionnaire';
            this.render();
        }
    }
    submitAnswers() {
        alert('Answers submitted!');
    }
}
