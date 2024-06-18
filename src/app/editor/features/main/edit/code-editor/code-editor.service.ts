import { Injectable, Inject, InjectionToken, Optional } from '@angular/core';
import { EventEmitter } from '@app/_shared/service/Emitter';
import { AsyncSubject, Observable } from 'rxjs';
export interface CodeEditorEvents {
  contentChanged: { content: string; filePath: string };
}

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
  private eventEmitter = new EventEmitter<CodeEditorEvents>();

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
      // listen to model change event
      model.onDidChangeContent(() => {
        const content = model.getValue();
        this.emit('contentChanged', {
          content,
          filePath: model.uri.path.slice(1), // remove '/' at the front
        });
      });
    }
    this.editor.setModel(model);
    this.editor.focus();
  }

  getCurrentFileContent() {
    const model = this.editor.getModel();
    const content = model.getValue();
    return content;
  }

  on<K extends keyof CodeEditorEvents>(
    event: K,
    listener: (payload: CodeEditorEvents[K]) => void
  ): void {
    this.eventEmitter.on(event, listener);
  }

  off<K extends keyof CodeEditorEvents>(
    event: K,
    listener: (payload: CodeEditorEvents[K]) => void
  ): void {
    this.eventEmitter.off(event, listener);
  }

  emit<K extends keyof CodeEditorEvents>(
    event: K,
    payload: CodeEditorEvents[K]
  ): void {
    this.eventEmitter.emit(event, payload);
  }
}
