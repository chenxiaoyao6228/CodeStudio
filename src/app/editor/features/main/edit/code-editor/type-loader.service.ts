import { Injectable, inject } from '@angular/core';
import { NodeContainerService } from '@app/editor/services/node-container.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { ImportKind, ImportResult, parseImports } from './deps-parsre.service';

export interface TypeDefinition {
  path: string;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class TypeLoaderService {
  private nodeContainerService = inject(NodeContainerService);
  private typeDefsSubject = new BehaviorSubject<TypeDefinition[]>([]);
  public readonly typeDefs$: Observable<TypeDefinition[]> = this.typeDefsSubject.asObservable();

  constructor() {}

  // load type definitions from dependencies
  async loadCurrentFileTypeDefinitions(
    parentPath: string,
    content: string
  ): Promise<{ typeDefinitions: TypeDefinition[]; pathMappings: any } | undefined> {
    const typeDefs: TypeDefinition[] = [];
    const pathMaps: any = {};

    const imports = parseImports(content);

    try {
      if (imports.length === 0) return;

      const files = await this.collectFilesToRead(imports);

      if (files.length === 0) return;

      await this.readFilesAndPopulateDefinitions(files, typeDefs, pathMaps);

      return { typeDefinitions: typeDefs, pathMappings: pathMaps };
    } catch (err) {
      console.error('Error loading type definitions:', err);
      return;
    }
  }

  // extend collectFilesToRead to include @types packages
  private async collectFilesToRead(imports: ImportResult[]): Promise<string[]> {
    const fileList: string[] = [];
    const dirList: string[] = [];

    await Promise.all(
      imports.map(async i => {
        switch (i.kind) {
          case ImportKind.Package: {
            const pkgContent = await this.readPackageJson(i.path);
            if (pkgContent) {
              const pkgJson = JSON.parse(pkgContent);
              if (pkgJson.exports) {
                this.extractFilesFromExports(pkgJson.exports, i.path, fileList, dirList);
              }
            }
            const typesPath = await this.checkForTypesPackage(i.path);
            if (typesPath) {
              const path = `./node_modules/@types/${i.path
                .replace(/^@/, '')
                .replace(/\//, '__')}/${this.normalize(typesPath)}`;
              if (path.includes('*')) {
                dirList.push(path.substring(0, path.lastIndexOf('/')));
              } else {
                fileList.push(path);
              }
            }
            break;
          }
          case ImportKind.Relative:
            // TODO:
            break;
          case ImportKind.Alias:
            // TODO:
            break;
          case ImportKind.Reference:
            // TODO:
            break;
          default:
            break;
        }
      })
    );

    const dirFiles = await this.collectDirectoryFiles(dirList);
    return [...fileList, ...dirFiles];
  }

  // read package.json file for a dependency
  private async readPackageJson(lib: string): Promise<string | undefined> {
    try {
      return await this.nodeContainerService.readFile(`./node_modules/${lib}/package.json`);
    } catch (err: any) {
      if (err.message.startsWith('ENOENT')) return;
      throw err;
    }
  }

  // extract file paths from package exports
  private extractFilesFromExports(exports: any, lib: string, fileList: string[], dirList: string[]) {
    for (const key in exports) {
      const exportEntry = exports[key];
      const types = exportEntry.typings ?? exportEntry.types;
      if (types) {
        const path = `./node_modules/${lib}/${this.normalize(typeof types === 'string' ? types : types.default)}`;
        if (path.includes('*')) {
          dirList.push(path.substring(0, path.lastIndexOf('/')));
        } else {
          fileList.push(path);
        }
      }
    }
  }

  // collect type definition files from directories
  private async collectDirectoryFiles(dirList: string[]): Promise<string[]> {
    const dirFiles = await Promise.all(dirList.map(dir => this.readTypeFilesFromDir(dir)));
    return dirFiles.flat();
  }

  // read type definition files from a directory
  private async readTypeFilesFromDir(dir: string): Promise<string[]> {
    const files = await this.nodeContainerService.getDirectoryFiles(dir);
    return files.filter(file => file.endsWith('.d.ts')).map(file => `${dir}/${file}`);
  }

  // read files and populate type definitions
  private async readFilesAndPopulateDefinitions(files: string[], typeDefs: TypeDefinition[], pathMaps: any) {
    await Promise.all(
      files.map(async file => {
        const content = await this.nodeContainerService.readFile(file);
        typeDefs.push({ path: file, content });
        const moduleName = this.extractModuleName(file);
        pathMaps[moduleName] = [`./node_modules/${moduleName}`];
      })
    );
  }

  // clean file path
  private normalize(path: string): string {
    if (path.startsWith('./')) return path.slice(2);
    if (path.startsWith('.')) return path.slice(1);
    return path;
  }

  // extract module name from path
  private extractModuleName(path: string): string {
    const parts = path.split('/');
    return parts[2]; // Assuming path like './node_modules/{module}/...'
  }

  // check for @types package
  private async checkForTypesPackage(lib: string): Promise<string | undefined> {
    const typesPackage = `@types/${lib.replace(/^@/, '').replace(/\//, '__')}`;
    try {
      const content = await this.nodeContainerService.readFile(`./node_modules/${typesPackage}/package.json`);
      const pkgJson = JSON.parse(content);
      return pkgJson.typings ?? pkgJson.types;
    } catch (err: any) {
      if (err.message.startsWith('ENOENT')) return;
      throw err;
    }
  }
}
