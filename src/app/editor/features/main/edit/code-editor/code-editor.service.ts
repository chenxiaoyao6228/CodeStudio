import { NodeContainerService } from '@app/editor/services/node-container.service';
import { Injectable, Inject, InjectionToken, Optional, inject } from '@angular/core';
import { EventEmitter } from '@app/_shared/service/Emitter';
import { AsyncSubject, take } from 'rxjs';
import { TypeDefinition, TypeLoaderService } from './type-loader.service';
import { IDisposable } from '@xterm/xterm';
import debounce from 'lodash/debounce';
import { PrettierService } from './prettier.service';
import { ShortcutService } from '@src/app/editor/services/shortcut';

export interface CodeEditorEvents {
  contentChanged: { content: string; filePath: string };
  goToDefinition: { filePath: string };
}

export const APP_MONACO_BASE_HREF = new InjectionToken<string>('appMonacoBaseHref');

@Injectable({
  providedIn: 'root',
})
export class CodeEditorService implements IDisposable {
  hasEdit = false;
  private typeLoaderService = inject(TypeLoaderService);
  private nodeContainerService = inject(NodeContainerService);
  private prettierService = inject(PrettierService);
  private afterScriptLoad$ = new AsyncSubject<boolean>();
  private isScriptLoaded = false;
  private editor: monaco.editor.IStandaloneCodeEditor | undefined;
  private eventEmitter = new EventEmitter<CodeEditorEvents>();
  private disposables: monaco.IDisposable[] = [];
  private shortcutService = inject(ShortcutService);
  private editorStates = new Map<string, monaco.editor.ICodeEditorViewState>();
  private debouncedResolveContents: () => void;

  constructor(@Optional() @Inject(APP_MONACO_BASE_HREF) private base: string) {
    this.loadMonacoScript();
    this.debouncedResolveContents = debounce(this.resolveContent.bind(this), 3000);
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

  setupContextMenu() {
    /*
     * https://github.com/microsoft/monaco-editor/issues/1280#issuecomment-2099873176
     * https://github.com/microsoft/monaco-editor/issues/1280
     */
    const removableIds = [
      'editor.action.quickOutline',
      'editor.action.rename',
      'editor.action.quickCommand',
      'editor.action.changeAll',
      // 'editor.action.clipboardCopyAction',
      // 'editor.action.clipboardPasteAction',
    ];
    // @ts-expect-error skip
    const contextmenu = this.editor.getContribution('editor.contrib.contextmenu');
    // @ts-expect-error skip
    const realMethod = contextmenu._getMenuActions;
    // @ts-expect-error skip
    contextmenu._getMenuActions = function (...args) {
      const items = realMethod.apply(contextmenu, args);
      return items.filter(function (item: any) {
        return !removableIds.includes(item.id);
      });
    };
  }

  initEditor(
    editorWrapper: HTMLElement,
    options: monaco.editor.IStandaloneEditorConstructionOptions
  ): monaco.editor.IStandaloneCodeEditor {
    if (!this.editor) {
      this.editor = monaco.editor.create(editorWrapper, options);

      // javascript
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      });

      // typescript
      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        baseUrl: '.',
        paths: {
          '*': ['src/*'],
        },
        allowJs: true,
        checkJs: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        jsxFactory: 'React.createElement',
        reactNamespace: 'React',
        allowSyntheticDefaultImports: true,
        noEmit: true,
        typeRoots: ['node_modules/@types'],
      });

      this.setUpPathIntellisenseListeners();
      this.setupAutoCompleteTag();
      this.setupContextMenu();
      this.listenToGoToDefinition(this.editor);
      this.shortcutService.overrideMonacoShortcuts(this.editor);

      // load prettier
      this.prettierService
        .loadPrettier()
        .pipe(take(1))
        .subscribe(() => {
          this.registerFormattingProviders();
        });
    }
    return this.editor;
  }

  formatCurrentFile() {
    this.prettierService
      .loadPrettier()
      .pipe(take(1))
      .subscribe(() => {
        const model = this.editor!.getModel();
        if (model) {
          const beforeCursorState = this.editor!.getSelections();
          const formattedCode = this.prettierService.format(model.getValue(), model.uri.path);
          this.updateModel(model.uri.path, formattedCode, beforeCursorState);
        }
      });
  }

  private updateModel(path: string, value: string, beforeCursorState: monaco.Selection[] | null) {
    const model = monaco.editor.getModels().find(model => model.uri.path === path);

    if (model && model.getValue() !== value) {
      model.pushEditOperations(
        beforeCursorState,
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ],
        inverseEditOperations => {
          // preserve cursor position
          return beforeCursorState;
        }
      );
    }
  }

  private registerFormattingProviders() {
    const provideDocumentFormattingEdits = (model: monaco.editor.ITextModel) => {
      const text = this.prettierService.format(model.getValue(), model.uri.path);
      return [
        {
          range: model.getFullModelRange(),
          text,
        },
      ];
    };

    monaco.languages.registerDocumentFormattingEditProvider('javascript', {
      provideDocumentFormattingEdits,
    });

    monaco.languages.registerDocumentFormattingEditProvider('typescript', {
      provideDocumentFormattingEdits,
    });

    monaco.languages.registerDocumentFormattingEditProvider('html', {
      provideDocumentFormattingEdits,
    });

    monaco.languages.registerDocumentFormattingEditProvider('css', {
      provideDocumentFormattingEdits,
    });

    monaco.languages.registerDocumentFormattingEditProvider('less', {
      provideDocumentFormattingEdits,
    });
  }

  private setUpPathIntellisenseListeners() {
    if (!this.editor) {
      throw Error('No editor');
    }

    const changeModelDisposable = this.editor.onDidChangeModel(({ newModelUrl }) => {
      console.log('newModelUrl', newModelUrl);
      this.resolveContent();
    });

    this.disposables.push(changeModelDisposable);

    const changeModelContentDisposable = this.editor.onDidChangeModelContent(e => {
      this.hasEdit = true; // mark as dirty
      this.debouncedResolveContents();
    });

    this.disposables.push(changeModelContentDisposable);

    // resolve first content if exist
    this.resolveContent();
  }

  async resolveContent() {
    const model = this.editor!.getModel();
    if (!model) {
      throw Error('No model');
    }

    const content = model.getLinesContent().join('\n');

    const res = await this.typeLoaderService.loadCurrentFileTypeDefinitions(model.uri.path, content);

    if (res) {
      const { typeDefinitions, pathMappings } = res;
      this.setupLibPathIntellisense(typeDefinitions, pathMappings);
    }
  }

  async setupLibPathIntellisense(typeDefinitions: TypeDefinition[], pathMappings: any) {
    await this.ensureMonacoLoaded();
    /*
     * https://stackoverflow.com/questions/77342362/monaco-editor-typescript-how-to-add-global-types
     * https://stackoverflow.com/questions/52290727/adding-typescript-type-declarations-to-monaco-editor
     * https://github.com/microsoft/monaco-editor/issues/2030
     * https://github.com/microsoft/monaco-editor/issues/3355
     * https://github.com/microsoft/monaco-editor/discussions/3718
     * https://stackoverflow.com/questions/57146485/monaco-editor-intellisense-from-multiple-files
     * https://stackoverflow.com/questions/73936684/performant-way-to-load-2000-ts-models-into-monaco-editor-for-intellisense
     */

    // load external ts files
    typeDefinitions.forEach(def => {
      const path = 'file://' + def.path.slice(1);
      monaco.languages.typescript.typescriptDefaults.addExtraLib(def.content, path);
    });

    const oldOptions = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...oldOptions,
      paths: {
        ...oldOptions?.paths,
        ...pathMappings,
      },
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
            const tsWorker = await monaco.languages.typescript.getTypeScriptWorker();
            const client = await tsWorker(model.uri);

            const defs = await client.getDefinitionAtPosition(model.uri.toString(), model.getOffsetAt(position));

            if (defs && defs.length > 0) {
              const def = defs[0];
              const resource = monaco.Uri.parse(def.fileName);
              let targetModel = monaco.editor.getModel(resource);

              if (!targetModel) {
                // Load the target file if not already opened in the editor
                const content = await this.nodeContainerService.readFile(resource.path.slice(1));
                const newModel = monaco.editor.createModel(content, 'typescript', resource);
                monaco.editor.setModelLanguage(newModel, 'typescript');
                targetModel = newModel;
              }

              editor.setModel(targetModel);

              this.emit('goToDefinition', {
                filePath: resource.path.slice(1),
              });

              // Move the cursor to the correct position
              const startPosition = targetModel.getPositionAt(def.textSpan.start);
              const endPosition = targetModel.getPositionAt(def.textSpan.start + def.textSpan.length);
              // might jump to ref file
              if (startPosition && endPosition) {
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
        }
      } catch (error) {
        console.log('F12 error: ', error);
      }
    });
  }

  private setupAutoCompleteTag() {
    const commonHtmlTags =
      'div,span,h1,h2,h3,h4,h5,h6,table,form,p,ul,ol,li,header,footer,nav,section,article,aside,main,figure,figcaption,blockquote,pre,code,button,label,select,option,optgroup,fieldset,legend,canvas,video,audio,source'.split(
        ','
      );

    const selfCloseTags = 'meta,img,link,input,textarea,br,hr,a'.split(',');

    // Map of self-closing tags with their key attributes
    const selfCloseTagAttributes: Record<string, string> = {
      meta: 'name',
      img: 'src',
      a: 'href',
      link: 'href',
      input: 'type',
      textarea: 'placeholder',
      br: '',
      hr: '',
    };

    const htmlCompletionItems = commonHtmlTags
      .filter(tag => !selfCloseTags.includes(tag))
      .map(tag => ({
        label: tag,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: `<${tag}>\n\t$0\n</${tag}>`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `A snippet for a <${tag}> element`,
        range: null, // will be set dynamically
      }));

    const selfCloseCompletionItems = selfCloseTags.map(tag => {
      const keyAttr = selfCloseTagAttributes[tag] ? ` ${selfCloseTagAttributes[tag]}="$0"` : '$0';
      return {
        label: tag,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: `<${tag}${keyAttr} />`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `A self-closing <${tag}> element`,
        range: null,
      };
    });

    const additionalCompletionItems = [
      {
        label: 'iframe',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: `<iframe src="$0" frameborder="0"></iframe>`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'A snippet for an iframe element',
        range: null,
      },
    ];

    const htmlSuggestions = [...htmlCompletionItems, ...selfCloseCompletionItems, ...additionalCompletionItems];

    const registerCompletionProvider = (language: string) => {
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

          return {
            suggestions: htmlSuggestions.map(item => ({ ...item, range })),
          };
        },
      });
    };

    registerCompletionProvider('html');
    registerCompletionProvider('javascript');
    registerCompletionProvider('typescript');
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

    // save the current state before switching
    if (this.editor) {
      const currentModel = this.editor.getModel();
      if (currentModel) {
        const currentFilePath = currentModel.uri.path.slice(1);
        this.saveEditorState(currentFilePath);
      }
    }

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

    // restore the state for the new file
    this.restoreEditorState(filePath);
  }

  closeFile(filePath: string) {
    const uri = monaco.Uri.parse(filePath);
    const model = monaco.editor.getModel(uri);
    if (model) {
      this.saveEditorState(filePath);
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
      const newModel = monaco.editor.createModel(content, model.getLanguageId(), newUri);

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

  saveEditorState(filePath: string): void {
    if (this.editor) {
      const state = this.editor.saveViewState();
      if (state) {
        this.editorStates.set(filePath, state);
      }
    }
  }

  restoreEditorState(filePath: string): void {
    if (this.editor) {
      const state = this.editorStates.get(filePath);
      if (state) {
        this.editor.restoreViewState(state);
      }
    }
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }

  on<K extends keyof CodeEditorEvents>(event: K, listener: (payload: CodeEditorEvents[K]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  off<K extends keyof CodeEditorEvents>(event: K, listener: (payload: CodeEditorEvents[K]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  emit<K extends keyof CodeEditorEvents>(event: K, payload: CodeEditorEvents[K]): void {
    this.eventEmitter.emit(event, payload);
  }
}
