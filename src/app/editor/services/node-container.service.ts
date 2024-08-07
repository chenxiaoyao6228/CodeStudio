import { Injectable, inject } from '@angular/core';
import { FileSystemTree, WebContainer, WebContainerProcess } from '@webcontainer/api';
import { BehaviorSubject } from 'rxjs';
import { EditorStateService } from './editor-state.service';
import { StartupPhase } from '../constants';
import { TerminalService } from '../features/main/ouput/terminal/terminal.service';
import { IRouteParams } from '../editor.component';

interface IOptions {
  terminal?: string;
  pkgManager?: 'npm' | 'yarn' | 'pnpm';
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
  fileMounted$ = new BehaviorSubject(false);
  // #state
  options: IOptions = {};

  devServerProcess: WebContainerProcess | null = null;
  webContainer: WebContainer | null = null;
  packageJson: Record<string, unknown> | null = null;

  async init(options: IRouteParams) {
    Object.assign(this.options, options);

    await this.startShell();
    // boot container
    await this.bootOrGetContainer();
    // mount files
    await this.mountFiles();

    // detect cmd command from package.json when not specified
    await this.detectTerminalCmdAndPkgManager();

    // set initialPath
    this.editorStateService.setCurrentFilePath('package.json');

    const shouldSkipInstall = await this.checkPackageJson();

    if (!shouldSkipInstall) {
      // install deps
      await this.installDeps();

      // start devServer
      await this.startDevServer();
    }
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

  private async checkPackageJson() {
    try {
      const pkgString = await this.readFile('package.json');
      const pkgContent = JSON.parse(pkgString);

      this.packageJson = pkgContent;

      const deps = pkgContent.dependencies;
      const devDeps = pkgContent.devDependencies;

      if (!deps && !devDeps) {
        this.editorStateService.setPhase(StartupPhase.READY);
        return true;
      }
      return false;
    } catch (error) {
      console.log('parse error in package.json', error);
      return false;
    }
  }

  private async installDeps() {
    this.editorStateService.setPhase(StartupPhase.INSTALLING);

    const installProcess = await this.spawnProcess(this.options.pkgManager!, ['install']);

    installProcess.output.pipeTo(
      new WritableStream({
        write: data => {
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
    const devServerProcess = await webContainer.spawn(this.options.pkgManager!, [
      'run',
      this.options!.terminal || 'dev',
    ]);

    devServerProcess.output.pipeTo(
      new WritableStream({
        write: data => {
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

  private async detectTerminalCmdAndPkgManager() {
    if (!this.options.terminal) {
      const pkgString = await this.readFile('package.json');
      const pkgContent = JSON.parse(pkgString);
      const scripts = pkgContent.scripts;
      // simple detection
      ['dev', 'start'].forEach(cmd => {
        if (scripts[cmd]) {
          this.options.terminal = cmd;
        }
      });
    }

    if (!this.options.pkgManager) {
      // auto detect by checking if package.json, yarn.lock, pnpm-lock.yaml exist
      if (await this.isFileExist('yarn.lock')) {
        this.options.pkgManager = 'yarn';
      } else if (await this.isFileExist('pnpm-lock.yaml')) {
        this.options.pkgManager = 'pnpm';
      } else if (await this.isFileExist('package-lock.json')) {
        this.options.pkgManager = 'npm';
      } else {
        this.options.pkgManager = 'npm';
      }
    }
  }

  async isFileExist(filePath: string) {
    try {
      await this.readFile(filePath);
      return true;
    } catch (error) {
      // console.log(`isFileExist: ${filePath} not exist`);
      return false;
    }
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
    terminal.onData(data => {
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

    this.fileMounted$.next(true);
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

  async getFileSystemTree(
    dir: string,
    filterFoldersPredicate: ((path?: string) => boolean) | undefined = () => true
  ): Promise<FileSystemTree> {
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
          } else if (entry.isDirectory() && filterFoldersPredicate(entry.name)) {
            files[entry.name] = { directory: {} };
            //@ts-expect-error skip
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
  }

  async getDirectoryFiles(directory: string): Promise<string[]> {
    const webContainer = await this.bootOrGetContainer();
    const files = await webContainer.fs.readdir(directory);
    return files;
  }
}
