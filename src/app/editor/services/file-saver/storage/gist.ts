import {
  GistService,
  stringifyDescription,
} from '@src/app/_shared/service/gist.service';
import { IStorage } from '../type';
import { inject, Injectable } from '@angular/core';

export const META_DATA__KEY = 'codestudio.json';
export const PROJECT_CODE_KEY = 'project_code';

@Injectable({ providedIn: 'root' })
export class GistStorage implements IStorage {
  gistService = inject(GistService);

  async save(
    content: Blob,
    filename: string,
    extraParams?: Record<string, any>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const gistId = extraParams ? extraParams['editId'] : '';
      const description = extraParams ? extraParams['description'] : '';
      const fullDescription = stringifyDescription({
        ...extraParams,
        title: filename,
        description,
      });
      const reader = new FileReader();
      reader.readAsDataURL(content);
      reader.onload = async () => {
        try {
          const mata = {
            title: filename,
            description: fullDescription,
          };
          const files = {
            [PROJECT_CODE_KEY]: {
              content: reader.result as string,
              encoding: 'base64',
            },
            [META_DATA__KEY]: {
              content: JSON.stringify(this.genMetaData()),
            },
          };

          // edit
          let result;
          if (gistId) {
            result = await this.gistService.updateGist(gistId, mata, files);
          } else {
            // add
            result = await this.gistService.addGist(mata, files);
          }

          resolve(result as any);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  }
  createDescription() {
    return 'meta data description for code-studio';
  }

  private genMetaData() {
    const now = new Date();
    const meta = {
      title: 'untitled',
      description: this.createDescription(),
      created_at: now.toISOString().replace('T', ' ').split('.')[0],
      updated_at: now.toISOString().replace('T', ' ').split('.')[0],
    };
    return meta;
  }
}
