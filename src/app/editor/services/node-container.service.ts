import { Injectable, inject } from '@angular/core';
import {
  FileSystemTree,
  WebContainer,
  WebContainerProcess,
} from '@webcontainer/api';
import { FileService } from './file.service';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { EditorStateService } from './editor-state.service';
import { StartupPhase } from '../constant';
import { files } from '../mockFile';
import { TerminalService } from '../features/main/ouput/terminal/terminal.service';
import { IRouteParams } from '../editor.component';
import { GithubFileService } from '@app/_shared/services/github.file.service';

interface IOptions {
  terminal: string;
  pkgManager: 'npm' | 'yarn' | 'pnpm';
  templateName?: string;
  githubPath?: string; // zipFile or folder
}

@Injectable({
  providedIn: 'root',
})
export class NodeContainerService {
  options: IOptions = {
    terminal: 'dev',
    pkgManager: 'npm', // TODO: should have a 'codestudio' item in package.json for setting
  };
  devServerProcess: WebContainerProcess | null = null;
  webContainer: WebContainer | null = null;
  fileService = inject(FileService);
  terminalService = inject(TerminalService);
  githubFileService = inject(GithubFileService);
  editorStateService = inject(EditorStateService);
  previewUrl$: BehaviorSubject<string> = new BehaviorSubject('');
  constructor() {
    // @ts-ignore
    window._container = this;
  }

  async init(options: IRouteParams) {
    Object.assign(this.options, options);

    await this.startShell();
    // boot container
    await this.bootOrGetContainer();
    // mount files
    await this.loadAndMountFiles();
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

  async loadAndMountFiles(): Promise<void> {
    this.editorStateService.setPhase(StartupPhase.LOADING_FILES);

    let fileTree = {} as FileSystemTree;
    if (this.options?.githubPath) {
      const path = this.options?.githubPath;
      if (this.githubFileService.validPath(path) && !path.endsWith('.zip')) {
        fileTree = await this.githubFileService.downloadFolder(path);
        console.log('fileTree', fileTree);
        await this.mountFiles(fileTree);
        return;
      }
    }

    fileTree = await lastValueFrom(this.fileService.getZipFile());
    await this.mountFiles(fileTree);

    // return await this.mountFiles(files);
  }

  private async mountFiles(fileSystemTree: FileSystemTree): Promise<void> {
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
      await webContainer.fs.writeFile(path, content, 'utf-8');
    } catch (error: any) {
      console.log('write file error: ', error);
      throw error;
    }
  }
  count = 1;
  async mockUpdateFile() {
    try {
      await this.writeFile(
        'app.jsx',
        `
        import { useState } from "preact/hooks";
  import "./app.css";
  
  export function App() {
    const [count, setCount] = useState(0);
  
    return (
      <>
        <h1>Vite + Preact + ${this.count++}</h1>
        <div class="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/app.jsx</code> and save to test HMR
          </p>
        </div>
        <p class="read-the-docs">
          Click on the Vite and Preact logos to learn more
        </p>
      </>
    );
  }
        `
      );
    } catch (error) {
      console.error('update file error: ', error);
    }
  }
}
