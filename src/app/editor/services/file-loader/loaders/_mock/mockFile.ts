export const consoleProxyMock = {
  'index.html': {
    file: {
      contents: `
        <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Test proxy console</title>
            </head>
            <body>
              <h1>proxy</h1>
            </body>
          </html> 
      `,
    },
  },

  'package.json': {
    file: {
      contents: `
        {
  "scripts": {
    "start": "servor --reload"
  },
  "dependencies": {
    "servor": "^4.0.2"
  }
}

      `,
    },
  },
};

export const mockFiles2 = {
  myproject: {
    directory: {
      'foo.js': {
        file: {
          contents: 'const x = 1;',
        },
      },
      emptyFolder: {
        directory: {},
      },
      '.envrc': {
        file: {
          contents: 'ENVIRONMENT=staging',
        },
      },
      src: {
        directory: {
          app: {
            directory: {
              components: {
                directory: {
                  header: {
                    directory: {
                      'header.component.ts': {
                        file: {
                          contents: 'export class HeaderComponent {}',
                        },
                      },
                      'header.component.html': {
                        file: {
                          contents: '<h1>Header</h1>',
                        },
                      },
                    },
                  },
                  footer: {
                    directory: {
                      'footer.component.ts': {
                        file: {
                          contents: 'export class FooterComponent {}',
                        },
                      },
                      'footer.component.html': {
                        file: {
                          contents: '<h1>Footer</h1>',
                        },
                      },
                    },
                  },
                },
              },
              services: {
                directory: {
                  'data.service.ts': {
                    file: {
                      contents: 'export class DataService {}',
                    },
                  },
                },
              },
              'app.module.ts': {
                file: {
                  contents: 'import { NgModule } from "@angular/core";',
                },
              },
            },
          },
          assets: {
            directory: {
              images: {
                directory: {
                  'logo.png': {
                    file: {
                      contents: 'base64encodedstring',
                    },
                  },
                },
              },
              styles: {
                directory: {
                  'styles.css': {
                    file: {
                      contents: 'body { margin: 0; }',
                    },
                  },
                },
              },
            },
          },
          environments: {
            directory: {
              'environment.ts': {
                file: {
                  contents: 'export const environment = { production: false };',
                },
              },
              'environment.prod.ts': {
                file: {
                  contents: 'export const environment = { production: true };',
                },
              },
            },
          },
        },
      },
      tests: {
        directory: {
          'app.component.spec.ts': {
            file: {
              contents: 'describe("AppComponent", () => {});',
            },
          },
        },
      },
    },
  },
  emptyFolder: {
    directory: {},
  },
};

export const mockFiles = {
  'index.js': {
    file: {
      contents: `
                import express from 'express';
                const app = express();
                const port = 3111;

                app.get('/', (req, res) => {
                res.send('Welcome to a WebContainers app! 🥳');
                });

                app.listen(port, () => {
                console.log(\`App is live at http://localhost:\${port}\`);
                });`,
    },
  },
  'package.json': {
    file: {
      contents: `
{
  "name": "example-app",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "nodemon": "latest"
  },
  "scripts": {
    "dev": "nodemon --watch './' index.js"
  }
}`,
    },
  },
};
