import { Injectable, inject } from '@angular/core';
import { GistService } from '../_shared/service/gist.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  gistService = inject(GistService)
  constructor() { }

  getList() {
    return this.gistService.getGists({
      page: 1,
      perPage: 100
    });
  }
}
