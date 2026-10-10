import FormLite from './FormLite';

export default class AppWithFormLite {
  render(): void {
    const form = new FormLite({ buttonName: 'Клик!' });
    document.getElementById('app')!.appendChild(form.element()!);
  }
}
