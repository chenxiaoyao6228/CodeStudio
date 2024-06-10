export interface ITemplateItem {
  name: string;
  url: string;
  terminal: string;
}

export const TEMPLATES_CONFIG = [
  {
    name: 'vanilla',
    url: 'https://github.com/chenxiaoyao6228/CodeStudio/blob/master/public/templates/vanilla.zip',
    terminal: 'dev',
  },
  {
    name: 'preact',
    url: 'https://github.com/chenxiaoyao6228/CodeStudio/blob/master/public/templates/preact.zip',
    terminal: 'dev',
  },
];
