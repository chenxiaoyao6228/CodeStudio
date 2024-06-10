import { Injectable, inject } from '@angular/core';
import { FileSystemTree, WebContainer } from '@webcontainer/api';
import { FileService } from './filefetcher.service';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { EditorStateService } from './editor-state.service';
import { StartupPhase } from '../constant';
import { files } from '../mockFile';

const NPM_PACKAGE_MANAGER = 'npm';
const STSRT_COMMAND = 'dev'; // TODO: should have a 'codestudio' item in package.json for setting

@Injectable({
  providedIn: 'root',
})
export class NodeContainerService {
  webContainer: WebContainer | null = null;
  fileService = inject(FileService);
  editorStateService = inject(EditorStateService);
  previewUrl$: BehaviorSubject<string> = new BehaviorSubject('');
  constructor() {}

  async init() {
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
          console.log('installDeps: ', data);
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
          console.log('devServerProcess: ', data);
        },
      })
    );
    //FIXME: 不能这么写!!! 不然永远不会返回url
    // if (await devServerProcess.exit) {
    //   console.error('🙀🙀🙀: Failed to start dev server');
    //   this.editorStateService.setPhase(StartupPhase.ERROR);
    //   return;
    // }

    webContainer.on('server-ready', (port: number, url: string) => {
      this.editorStateService.setPhase(StartupPhase.READY);
      this.previewUrl$.next(url);
    });

    return devServerProcess;
  }

  async handleError() {
    const webContainer = await this.bootOrGetContainer();

    webContainer.on('error', ({ message }) => {
      console.error('🙀🙀🙀: Error', message);
      this.editorStateService.setPhase(StartupPhase.ERROR);
      this.cleanUp();
    });
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
