import { environment } from "@src/environments /environment";

export interface ITemplateItem {
  name: string;
  url: string;
  terminal: string;
  icon: string;
}


const BASE_URL = environment.baseUrl;

export const TEMPLATES_CONFIG = [
  {
    name: 'react',
    url: `${BASE_URL}/templates/react.zip`,
    icon: '/assets/imgs/template/react.svg',
    terminal: 'dev',
  },
  {
    name: 'vue3',
    url: `${BASE_URL}/templates/vue3.zip`,
    icon: '/assets/imgs/template/vue.svg',
    terminal: 'dev',
  },
  {
    name: 'angular',
    url: `${BASE_URL}/templates/angular.zip`,
    icon: '/assets/imgs/template/angular.svg',
    terminal: 'start',
  },
  {
    name: 'vanilla',
    url: `${BASE_URL}/templates/vanilla.zip`,
    icon: '/assets/imgs/template/vanilla.svg',
    terminal: 'dev',
  },
  {
    name: 'node',
    url: `${BASE_URL}/templates/node.zip`,
    icon: '/assets/imgs/template/node.svg',
    terminal: 'dev',
  },


];
