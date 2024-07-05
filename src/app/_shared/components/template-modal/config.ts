import { environment } from '@src/environments/environment';

export interface ITemplateItem {
  name: string;
  url: string;
  terminal: string;
  icon: string;
}

const BASE_URL = environment.baseUrl;

export const TEMPLATES_CONFIG = [
  {
    name: 'React',
    desc: 'Typescript',
    url: `${BASE_URL}/templates/react-ts.zip`,
    icon: '/assets/imgs/template/react.svg',
    terminal: 'dev',
  },
  {
    name: 'Vue3',
    desc: 'Typescript',
    url: `${BASE_URL}/templates/vue3-ts.zip`,
    icon: '/assets/imgs/template/vue.svg',
    terminal: 'dev',
  },
  {
    name: 'Solid',
    desc: 'Typescript',
    url: `${BASE_URL}/templates/solid-ts.zip`,
    icon: '/assets/imgs/template/solid.svg',
    terminal: 'dev',
  },
  {
    name: 'Angular',
    desc: 'Typescript',
    url: `${BASE_URL}/templates/angular.zip`,
    icon: '/assets/imgs/template/angular.svg',
    terminal: 'start',
  },
  {
    name: 'Vanilla',
    desc: 'Javascript',
    url: `${BASE_URL}/templates/vanilla.zip`,
    icon: '/assets/imgs/template/vanilla.svg',
    terminal: 'dev',
  },
  {
    name: 'Static',
    desc: 'HTML/CSS/JS',
    url: `${BASE_URL}/templates/static.zip`,
    icon: '/assets/imgs/template/static.svg',
    terminal: 'start',
  },
  {
    name: 'Node',
    desc: 'Blank project',
    url: `${BASE_URL}/templates/node.zip`,
    icon: '/assets/imgs/template/node.svg',
    terminal: 'dev',
  },
  {
    name: 'Next',
    desc: 'Node',
    url: `${BASE_URL}/templates/next.zip`,
    icon: '/assets/imgs/template/next.svg',
    terminal: 'dev',
  },
];
