import { Injectable, inject } from '@angular/core';
import {
  FileSystemTree,
  WebContainer,
  WebContainerProcess,
} from '@webcontainer/api';
import { FileService } from './filefetcher.service';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { EditorStateService } from './editor-state.service';
import { StartupPhase } from '../constant';
import { files } from '../mockFile';
import { TerminalService } from '../features/main/ouput/terminal/terminal.service';

const NPM_PACKAGE_MANAGER = 'npm';
const STSRT_COMMAND = 'dev'; // TODO: should have a 'codestudio' item in package.json for setting

@Injectable({
  providedIn: 'root',
})
export class NodeContainerService {
  devServerProcess: WebContainerProcess | null = null;
  webContainer: WebContainer | null = null;
  fileService = inject(FileService);
  terminalService = inject(TerminalService);
  editorStateService = inject(EditorStateService);
  previewUrl$: BehaviorSubject<string> = new BehaviorSubject('');
  constructor() {}

  async init() {
    await this.startShell();
    // boot container
    await this.bootOrGetContainer();
    // mount files
    await this.processZipFile();
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

    const installProcess = await this.spawnProcess(NPM_PACKAGE_MANAGER, [
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
    const devServerProcess = await webContainer.spawn(NPM_PACKAGE_MANAGER, [
      'run',
      STSRT_COMMAND,
    ]);

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
      if (domEvent.ctrlKey && domEvent.key === 'c') {
        console.log('Ctrl + C was pressed');
        this.stopDevServer();
      }
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

  async processZipFile(): Promise<void> {
    // const fileTree = await lastValueFrom(this.fileService.getZipFile());
    // await this.mountFiles(fileTree);

    return await this.mountFiles(files);
  }

  private async mountFiles(fileSystemTree: FileSystemTree): Promise<void> {
    const webContainer = await this.webContainer!;

    await webContainer.mount(fileSystemTree);
  }
}
