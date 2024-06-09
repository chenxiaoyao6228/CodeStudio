import { Injectable, inject } from '@angular/core';
import { FileSystemTree, WebContainer } from '@webcontainer/api';
import { FileService } from './filefetcher.service';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { EditorStateService } from './editor-state.service';
import { StartupPhase } from '../constant';
import { files } from '../mockFile';

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
    await this.bootContainer();
    // mount files
    await this.processZipFile();
    // install deps
    await this.installDeps();
    // start devServer
    await this.startDevServer();
  }
  private async bootContainer() {
    this.editorStateService.setPhase(StartupPhase.BOOTING);

    if (this.webContainer) {
      return this.webContainer;
    }
    this.webContainer = await WebContainer.boot();
    return this.webContainer;
  }
  private async installDeps() {
    this.editorStateService.setPhase(StartupPhase.INSTALLING);

    const installProcess = await this.spawnProcess('npm', ['install']);

    if (await installProcess.exit) {
      console.error('🙀🙀🙀: Failed to intall deps');
      this.editorStateService.setPhase(StartupPhase.ERROR);
      return;
    }

    installProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          console.log('data', data);
        },
      })
    );

    return installProcess.exit;
  }
  async spawnProcess(command: string, args: string[]) {
    const webContainer = await this.bootContainer();
    const process = await webContainer.spawn(command, args);
    return process;
  }

  async startDevServer() {
    this.editorStateService.setPhase(StartupPhase.STARTING_DEV_SERVER);

    const webContainer = await this.bootContainer();
    const process = await webContainer.spawn('npm', ['run', 'dev']);

    if (await process.exit) {
      console.error('🙀🙀🙀: Failed to start dev server');
      this.editorStateService.setPhase(StartupPhase.ERROR);
      return;
    }

    webContainer.on('server-ready', (port: number, url: string) => {
      this.editorStateService.setPhase(StartupPhase.READY);
      this.previewUrl$.next(url);
    });

    return process;
  }

  async processZipFile(): Promise<void> {
    // const fileTree = await lastValueFrom(this.fileService.getZipFile());

    // await this.mountFiles(fileTree);
    await this.mountFiles(files);
  }

  private async mountFiles(fileSystemTree: FileSystemTree): Promise<void> {
    const webContainer = await this.webContainer!;

    await webContainer.mount(fileSystemTree);
  }
}
