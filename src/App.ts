//@ts-nocheck
//eslint-disable-next-line
import * as Pages from './pages/index.js';
import './helpers/handlebarsHelpers.js';
import { AnswerPage } from './pages/answerPage/answerPage.js';

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
      this.appElement.replaceWith(answerPage.getContent());
    }
    //this.attachEventListeners();
  }

  attachEventListeners() {
    if (this.state.currentPage === 'createQuestionnaire') {
      const addButton = document.getElementById('add-question');
      const createButton = document.getElementById('create-questionnaire');
      
      addButton.addEventListener('click', () => this.addQuestion());
      createButton.addEventListener('click', () => this.createQuestionnaire());
    } else {
      const submitButton = document.getElementById('submit-answers');
      submitButton.addEventListener('click', () => this.submitAnswers());
    }

    const footerLinks = document.querySelectorAll('.footer-link');
    footerLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.changePage(e.target.dataset.page);
      });
    });
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