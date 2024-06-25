<p align="center">
  <a href="#">
    <img width="200" src="./public/logo.jpg" alt="Code Studio Logo">
  </a>
</p>

<h1 align="center">Code Studio</h1>
<h3 align="center">Web code runner for JS and NodeJS</h3>

## Features

- Create project from existing templates
- Import folder as template from GitHub by passing (sub)folder path directly

### Passing GitHub repo URL

- source: a GitHub folder path or a zip file path
- terminal: npm execute command after installation, default value: `dev`

Examples:

- [Passing a zip file path](https://code-studio.chenxiaoyao.cn/edit?terminal=dev&source=https://code-studio.chenxiaoyao.cn/templates/vue3.zip)
- [Passing a GitHub folder](https://code-studio.chenxiaoyao.cn/edit?terminal=dev&source=https://github.com/chenxiaoyao6228/fe-notes/tree/main/Editor/_demo/webcontainers-express-app)

## Development

```sh
yarn install
yarn start
```

## Reference

- https://webcontainers.io
- https://github.com/xtermjs/xterm.js
- https://angular.dev/
- https://material.angular.io/
