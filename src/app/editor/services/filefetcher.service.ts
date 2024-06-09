import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import JSZip from 'jszip';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private fileUrl = 'http://localhost:4200/templates/vite-react.zip';

  constructor(private http: HttpClient) {}

  getZipFile(): Observable<FileSystemTree> {
    return this.http.get(this.fileUrl, { responseType: 'blob' }).pipe(
      switchMap((blob) => from(JSZip.loadAsync(blob))),
      switchMap(async (zip) => {
        const files: FileSystemTree = {};

        const processFile = async (
          relativePath: string,
          file: JSZip.JSZipObject
        ) => {
          const segments = relativePath.split('/');
          let current: FileSystemTree | DirectoryNode = files;

          for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (i === segments.length - 1) {
              (current as FileSystemTree)[segment] = {
                file: {
                  contents: await file.async('string'),
                },
              };
            } else {
              if (!(segment in (current as FileSystemTree))) {
                (current as FileSystemTree)[segment] = {
                  directory: {},
                };
              }
              current = (current as FileSystemTree)[segment] as DirectoryNode;
            }
          }
        };

        await Promise.all(
          Object.keys(zip.files).map(async (relativePath) => {
            const file = zip.files[relativePath];
            if (!file.dir) {
              await processFile(relativePath, file);
            }
          })
        );

        return files;
      })
    );
  }
}
