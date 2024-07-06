import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

declare const window: any;

@Injectable({
  providedIn: 'root',
})
export class PrettierService {
  private prettier: any;
  private prettierPlugins: any;
  private isLoaded = new BehaviorSubject<boolean>(false);

  constructor() {}

  loadPrettier(): Observable<boolean> {
    if (this.isLoaded.value) {
      return this.isLoaded.asObservable();
    }

    window.define(
      'Prettier',
      [
        '/assets/prettier/standalone.js',
        '/assets/prettier/parser-babel.js',
        '/assets/prettier/parser-html.js',
        '/assets/prettier/parser-postcss.js',
        '/assets/prettier/parser-typescript.js',
      ],
      (Prettier: any, ...args: any[]) => {
        this.prettier = Prettier;
        this.prettierPlugins = {
          babel: args[0],
          html: args[1],
          postcss: args[2],
          typescript: args[3],
        };
        this.isLoaded.next(true);
      }
    );

    return this.isLoaded.asObservable();
  }

  format(code: string, filepath: string): string {
    if (!this.prettier || !this.prettierPlugins) {
      console.error('Prettier or PrettierPlugins not loaded');
      return code;
    }

    const options = {
      filepath,
      plugins: this.prettierPlugins,
      singleQuote: true,
      tabWidth: 4,
    };

    try {
      return this.prettier.format(code, options);
    } catch (error) {
      console.error('Prettier formatting error:', error);
      return code;
    }
  }
}
