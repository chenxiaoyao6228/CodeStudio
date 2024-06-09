import { Injectable, inject } from '@angular/core';
import {
  FileSystemTree,
  WebContainer,
  WebContainerProcess,
} from '@webcontainer/api';
import { FileService } from './filefetcher.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NodeContainerService {
  webContainer: WebContainer | null = null;
  fileService = inject(FileService);
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
    if (this.webContainer) {
      return this.webContainer;
    }
    this.webContainer = await WebContainer.boot();
    return this.webContainer;
  }
  private async installDeps() {
    const installProcess = await this.spawnProcess('npm', ['install']);

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
    const webContainer = await this.bootContainer();
    const process = await webContainer.spawn('npm', ['run', 'dev']);
    return process;
  }

  async processZipFile(): Promise<void> {
    const fileTree = await lastValueFrom(this.fileService.getZipFile());

    await this.mountFiles(fileTree);
  }

  private async mountFiles(fileSystemTree: FileSystemTree): Promise<void> {
    const webContainer = await this.webContainer!;

    await webContainer.mount(fileSystemTree);
  }
}
