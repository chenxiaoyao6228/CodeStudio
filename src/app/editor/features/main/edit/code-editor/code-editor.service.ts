import { NodeContainerService } from '@app/editor/services/node-container.service';
import {
  Injectable,
  Inject,
  InjectionToken,
  Optional,
  inject,
} from '@angular/core';
import { EventEmitter } from '@app/_shared/service/Emitter';
import { AsyncSubject } from 'rxjs';
import { TypeDefinition } from './type-loader.service';

export interface CodeEditorEvents {
  contentChanged: { content: string; filePath: string };
  goToDefinition: { filePath: string };
}

export const APP_MONACO_BASE_HREF = new InjectionToken<string>(
  'appMonacoBaseHref'
);

@Injectable({
  providedIn: 'root',
})
export class CodeEditorService {
  nodeContainerService = inject(NodeContainerService);
  private afterScriptLoad$ = new AsyncSubject<boolean>();
  private isScriptLoaded = false;
  private editor: monaco.editor.IStandaloneCodeEditor | undefined;
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

  async ensureMonacoLoaded(): Promise<void> {
    if (!this.isScriptLoaded) {
      await this.afterScriptLoad$.toPromise();
    }
  }

  initEditor(
    editorWrapper: HTMLElement,
    options: monaco.editor.IStandaloneEditorConstructionOptions
  ): monaco.editor.IStandaloneCodeEditor {
    if (!this.editor) {
      this.editor = monaco.editor.create(editorWrapper, options);

      this.listenToGoToDefinition(this.editor!);
    }
    return this.editor;
  }

  async setupPathIntellisense(
    typeDefinitions: TypeDefinition[],
    pathMappings: any
  ) {
    await this.ensureMonacoLoaded();

    /*
     * https://github.com/microsoft/monaco-editor/issues/2030
     * https://github.com/microsoft/monaco-editor/issues/3355
     * https://github.com/microsoft/monaco-editor/discussions/3718
     * https://stackoverflow.com/questions/57146485/monaco-editor-intellisense-from-multiple-files
     * https://stackoverflow.com/questions/73936684/performant-way-to-load-2000-ts-models-into-monaco-editor-for-intellisense
     */

    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });

    // load external ts files
    typeDefinitions.forEach((def) => {
      const path = 'file://' + def.path.slice(1);
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        def.content,
        path
      );
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      baseUrl: '.',
      paths: {
        '*': ['src/*'],
        ...pathMappings,
      },
      allowJs: true,
      checkJs: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      reactNamespace: 'React',
      allowSyntheticDefaultImports: true,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      typeRoots: ['node_modules/@types'],
    });
  }

  private listenToGoToDefinition(editor: monaco.editor.IStandaloneCodeEditor) {
    editor.addCommand(monaco.KeyCode.F12, async () => {
      try {
        const position = editor.getPosition();
        const model = editor.getModel();
        if (model && position) {
          const word = model.getWordAtPosition(position);
          if (word) {
            const definition =
              await monaco.languages.typescript.getTypeScriptWorker();
            const client = await definition(model.uri);

            const defs = await client.getDefinitionAtPosition(
              model.uri.toString(),
              model.getOffsetAt(position)
            );

            if (defs && defs.length > 0) {
              const def = defs[0];
              const resource = monaco.Uri.parse(def.fileName);
              let targetModel = monaco.editor.getModel(resource);

              if (!targetModel) {
                // Load the target file if not already opened in the editor
                const content = await this.nodeContainerService.readFile(
                  resource.path.slice(1)
                );
                const newModel = monaco.editor.createModel(
                  content,
                  'typescript',
                  resource
                );
                monaco.editor.setModelLanguage(newModel, 'typescript');
                targetModel = newModel;
              }

              this.emit('goToDefinition', {
                filePath: resource.path.slice(1),
              });

              // Move the cursor to the correct position
              const startPosition = targetModel.getPositionAt(
                def.textSpan.start
              );
              const endPosition = targetModel.getPositionAt(
                def.textSpan.start + def.textSpan.length
              );

              editor.setModel(targetModel);
              editor.setSelection(
                new monaco.Range(
                  startPosition.lineNumber,
                  startPosition.column,
                  endPosition.lineNumber,
                  endPosition.column
                )
              );
              editor.revealLineInCenter(startPosition.lineNumber);
            }
          }
        }
      } catch (error) {
        console.log('F12 error: ', error);
      }
    });
  }

  async setLanguage(language: string) {
    const model = this.editor!.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }

  isModelExist(filePath: string) {
    const uri = monaco.Uri.parse(filePath);
    const model = monaco.editor.getModel(uri);
    return model ? true : false;
  }

  async openOrCreateFile(params: { filePath: string; content?: string }) {
    const { content, filePath } = params;
    const language = this.getLanguageByFilePath(filePath);
    await this.setLanguage(language);

    const uri = monaco.Uri.parse(filePath);
    let model = monaco.editor.getModel(uri);
    if (!model && content) {
      model = monaco.editor.createModel(content, language, uri);
      // listen to model change event
      model.onDidChangeContent(() => {
        const content = model!.getValue();
        this.emit('contentChanged', {
          content,
          filePath: model!.uri.path.slice(1), // remove '/' at the front
        });
      });
    }
    this.editor!.setModel(model);
    this.editor!.focus();
  }

  closeFile(filePath: string) {
    const uri = monaco.Uri.parse(filePath);
    const model = monaco.editor.getModel(uri);
    if (model) {
      model.dispose();
    }
  }

  async moveFileOrFolder(oldPath: string, newPath: string): Promise<void> {
    const oldUri = monaco.Uri.parse(oldPath);
    const newUri = monaco.Uri.parse(newPath);
    const model = monaco.editor.getModel(oldUri);

    if (model) {
      // Get the content from the old model
      const content = model.getValue();

      // Create a new model with the same content at the new URI
      const newModel = monaco.editor.createModel(
        content,
        model.getLanguageId(),
        newUri
      );

      // Dispose of the old model
      model.dispose();

      // If the old model was currently open, set the new model in the editor
      if (this.editor!.getModel() === model) {
        this.editor!.setModel(newModel);
        this.editor!.focus();
      }
    }
  }

  getCurrentFileContent() {
    const model = this.editor!.getModel();
    const content = model!.getValue();
    return content;
  }

  getLanguageByFilePath(filePath: string) {
    const suffix = filePath.split('.').pop() || 'default';

    const languageMap: Record<string, string> = {
      js: 'javascript',
      mjs: 'javascript',
      css: 'css',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      vue: 'vue',
      prettierrc: 'json',
      default: 'json',
    };

    return languageMap[suffix] || 'json';
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
