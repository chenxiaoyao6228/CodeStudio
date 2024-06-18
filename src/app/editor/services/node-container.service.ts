import { Injectable, inject } from '@angular/core';
import {
  FileSystemTree,
  WebContainer,
  WebContainerProcess,
} from '@webcontainer/api';
import { BehaviorSubject } from 'rxjs';
import { EditorStateService } from './editor-state.service';
import { StartupPhase } from '../constants';
import { TerminalService } from '../features/main/ouput/terminal/terminal.service';
import { IRouteParams } from '../editor.component';

interface IOptions {
  terminal: string;
  pkgManager: 'npm' | 'yarn' | 'pnpm';
}

@Injectable({
  providedIn: 'root',
})
export class NodeContainerService {
  // #deps
  terminalService = inject(TerminalService);
  editorStateService = inject(EditorStateService);
  // #event
  previewUrl$ = new BehaviorSubject('');
  // #state
  options: IOptions = {
    terminal: 'dev',
    pkgManager: 'npm', // TODO: should have a 'codestudio' item in package.json for setting
  };
  devServerProcess: WebContainerProcess | null = null;
  webContainer: WebContainer | null = null;

  constructor() {}

  async init(options: IRouteParams) {
    Object.assign(this.options, options);

    await this.startShell();
    // boot container
    await this.bootOrGetContainer();
    // mount files
    await this.mountFiles();
    // install deps
    await this.installDeps();
    // start devServer
    await this.startDevServer();
  }

  private async bootOrGetContainer() {
    if (this.webContainer) {
      return this.webContainer;
    }

    this.terminalService.write('[codeStudio]: Booting WebContainer...\n');

    this.editorStateService.setPhase(StartupPhase.BOOTING);
    this.webContainer = await WebContainer.boot();

    return this.webContainer;
  }

  private async installDeps() {
    this.editorStateService.setPhase(StartupPhase.INSTALLING);

    const installProcess = await this.spawnProcess(this.options.pkgManager, [
      'install',
    ]);

    installProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.terminalService.write(data);
        },
      })
    );

    return installProcess.exit;
  }

  async spawnProcess(command: string, args: string[]) {
    const webContainer = await this.bootOrGetContainer();
    const process = await webContainer.spawn(command, args);
    return process;
  }

  async startDevServer() {
    this.editorStateService.setPhase(StartupPhase.STARTING_DEV_SERVER);

    const webContainer = await this.bootOrGetContainer();
    const devServerProcess = await webContainer.spawn(
      this.options!.pkgManager,
      ['run', this.options!.terminal]
    );

    devServerProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.terminalService.write(data);
        },
      })
    );

    this.devServerProcess = devServerProcess;

    webContainer.on('server-ready', (port: number, url: string) => {
      this.editorStateService.setPhase(StartupPhase.READY);
      this.previewUrl$.next(url);
    });

    return devServerProcess;
  }

  async handleError() {
    const webContainer = await this.bootOrGetContainer();

    webContainer.on('error', ({ message }) => {
      this.terminalService.write('[codeStudio]: Error🙀: ' + message);
      this.editorStateService.setPhase(StartupPhase.ERROR);
      this.cleanUp();
    });
  }

  async startShell() {
    const webContainer = await this.bootOrGetContainer();
    const terminal = this.terminalService.getXterminal();
    const shellProcess = await webContainer.spawn('jsh');
    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      })
    );

    const input = shellProcess.input.getWriter();
    terminal.onData((data) => {
      input.write(data);
    });

    // event listener
    terminal.onKey(({ key, domEvent }) => {
      // if (domEvent.ctrlKey && domEvent.key === 'c') {
      //   console.log('Ctrl + C was pressed');
      //   this.stopDevServer();
      // }
    });

    return shellProcess;
  }

  stopDevServer() {
    if (this.devServerProcess) {
      this.devServerProcess.kill();
      this.previewUrl$.next('404.html');
    }
  }

  cleanUp() {
    console.log('cleanUp');
    this.webContainer?.teardown();
  }

  private async mountFiles(): Promise<void> {
    const fileSystemTree = this.editorStateService.getFileTree();

    if (!fileSystemTree) {
      throw new Error('fileSystemTree is null');
    }
    const webContainer = await this.webContainer!;

    await webContainer.mount(fileSystemTree);
  }

  async readFile(filePath: string): Promise<string> {
    const webContainer = await this.bootOrGetContainer();
    return webContainer.fs.readFile(filePath, 'utf-8');
  }

  async writeFile(path: string, content: string | Buffer): Promise<void> {
    const webContainer = await this.bootOrGetContainer();

    try {
      await webContainer.fs.writeFile('/' + path, content, 'utf-8');
    } catch (error: any) {
      console.log('write file error: ', error);
      throw error;
    }
  }

  async createFile(path: string, content = ''): Promise<void> {
    try {
      await this.writeFile(path, content);
    } catch (error: any) {
      console.log('create file error: ', error);
      throw error;
    }
  }

  async createFolder(path: string): Promise<void> {
    const webContainer = await this.bootOrGetContainer();
    try {
      await webContainer.fs.mkdir('/' + path, { recursive: true });
    } catch (error: any) {
      console.log('create folder error: ', error);
      throw error;
    }
  }

  async renameFileOrFolder(oldPath: string, newPath: string): Promise<void> {
    const webContainer = await this.bootOrGetContainer();
    try {
      await webContainer.fs.rename(oldPath, newPath);
    } catch (error: any) {
      console.log('rename file/folder error: ', error);
      throw error;
    }
  }

  async deleteFileOrFolder(path: string): Promise<void> {
    const webContainer = await this.bootOrGetContainer();
    try {
      await webContainer.fs.rm(path, { recursive: true, force: true });
    } catch (error: any) {
      console.log('delete file/folder error: ', error);
      throw error;
    }
  }

  getFileSystemTree = async (
    dir: string,
    filterFoldersPredicate: ((path?: string) => boolean) | undefined = () =>
      true
  ): Promise<FileSystemTree> => {
    try {
      const webContainer = await this.bootOrGetContainer();
      const fs = webContainer.fs;

      const files: FileSystemTree = {};

      await loadContent(dir, files);

      return files;

      async function loadContent(currentDir: string, files: FileSystemTree) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = normalizePath(`${currentDir}/${entry.name}`);

          if (entry.isFile()) {
            const content = await fs.readFile(fullPath, 'utf-8');
            files[entry.name] = { file: { contents: content } };
          } else if (
            entry.isDirectory() &&
            filterFoldersPredicate(entry.name)
          ) {
            files[entry.name] = { directory: {} };
            // @ts-ignore
            await loadContent(fullPath, files[entry.name].directory);
          }
        }
      }
      function normalizePath(path: string) {
        if (path[0] === '/') {
          return path.substring(1);
        }
        return path;
      }
    } catch (error) {
      console.error('Error while fetching file system tree:', error);
      throw error;
    }
  };
}
