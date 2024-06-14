import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { AsyncSubject } from 'rxjs';

declare const monaco: any;

export const APP_MONACO_BASE_HREF = new InjectionToken<string>(
  'appMonacoBaseHref'
);

@Injectable({
  providedIn: 'root',
})
export class CodeEditorService {
  private afterScriptLoad$ = new AsyncSubject<boolean>();
  private isScriptLoaded = false;
  private editor: any = undefined;

  constructor(@Optional() @Inject(APP_MONACO_BASE_HREF) private base: string) {
    this.loadMonacoScript();
  }

  public getScriptLoadSubject(): AsyncSubject<boolean> {
    return this.afterScriptLoad$;
  }

  private loadMonacoScript(): void {
    if (this.isScriptLoaded) {
      this.afterScriptLoad$.next(true);
      this.afterScriptLoad$.complete();
      return;
    }

    const onGotAmdLoader = () => {
      (window as any).require.config({
        paths: { vs: `${this.base || 'assets/vs'}` },
      });
      (window as any).require(['vs/editor/editor.main'], () => {
        this.isScriptLoaded = true;
        this.afterScriptLoad$.next(true);
        this.afterScriptLoad$.complete();
      });
    };

    if (!(window as any).require) {
      const loaderScript = document.createElement('script');
      loaderScript.type = 'text/javascript';
      loaderScript.src = `${this.base || 'assets/vs'}/loader.js`;
      loaderScript.onload = onGotAmdLoader;
      document.body.appendChild(loaderScript);
    } else {
      onGotAmdLoader();
    }
  }

  initEditor(editorWrapper: HTMLElement, options: any): void {
    if (!this.editor) {
      this.editor = monaco.editor.create(editorWrapper, options);
    }
    return this.editor;
  }

  openOrCreateFile(params: {
    filePath: string;
    content?: string;
    language?: string;
  }) {
    const { content, language, filePath } = params;
    const uri = monaco.Uri.parse(filePath);
    let model = monaco.editor.getModel(uri);
    if (!model) {
      model = monaco.editor.createModel(content, language, uri);
    }
    this.editor.setModel(model);
  }
  getCurrentFileContent() {
    const model = this.editor.getModel();
    const content = model.getValue();
    return content;
  }
}
