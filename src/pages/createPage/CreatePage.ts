import Block from '../../framework/Block';
import type { BlockOwnProps } from '../../framework/Block';

interface CreatePageProps extends BlockOwnProps {
  questions?: string[];
  createButtonDisabled?: boolean;
  onCreateQuestionnaire?: (questions: string[]) => void;
  onNavigate?: (path: string) => void;
}

export default class CreatePage extends Block<CreatePageProps> {
  protected template = `
    <div class="app">
      <h1>Create Questionnaire</h1>
      {{Input id="question-input" type="text" placeholder="Enter question" ref="questionInput"}}
      {{Button id="add-question" text="Add Question"}}
      <p>Questions: {{questions.length}}/20</p>
      {{#if questions.length}}
        <ul>
          {{#each questions}}
            <li>{{this}}</li>
          {{/each}}
        </ul>
      {{/if}}
      {{Button id="create-questionnaire" text="Create Questionnaire" disabled=createButtonDisabled}}
      {{Footer}}
    </div>
  `;

  constructor(props: CreatePageProps = {}) {
    super({ questions: [], createButtonDisabled: true, ...props });
  }

  private addQuestion(question: string) {
    const questions = [...(this.props.questions ?? []), question];
    this.setProps({ questions, createButtonDisabled: false });
  }

  protected events = {
    click: (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.id === 'add-question') {
        const input = this.refs['questionInput'] as HTMLInputElement;
        if (input?.value.trim()) {
          this.addQuestion(input.value.trim());
        }
      } else if (target.id === 'create-questionnaire') {
        const questions = this.props.questions ?? [];
        if (questions.length > 0) {
          this.props.onCreateQuestionnaire?.(questions);
        }
      } else if (target.tagName === 'A' && target.href) {
        e.preventDefault();
        const url = new URL(target.href);
        this.props.onNavigate?.(url.pathname);
      }
    },
  };
}
