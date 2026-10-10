import Handlebars from 'handlebars';

Handlebars.registerHelper('concat', function (...args: unknown[]) {
  return args.slice(0, -1).join('');
});
