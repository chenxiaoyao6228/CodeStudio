import { FileSystemTree } from '@webcontainer/api';

export const mockFileSystemTree: FileSystemTree = {
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
