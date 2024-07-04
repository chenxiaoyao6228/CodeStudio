import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './components/header/header.component';
import { MatDialog } from '@angular/material/dialog';
import { TemplateModalComponent } from '../_shared/components/template-modal/template-modal.component';
import { HomeService } from './home.service';
import {
  IGistItem,
  GistService,
  parseDescription,
} from '../_shared/service/gist.service';
import { formatTime } from '../_shared/utils';
import { PROJECT_KEY } from '../_shared/constant';
import { Router } from '@angular/router';

export interface Project {
  id: string;
  title: string;
  description: string;
  updated: string;
  gistUrl: string;
  metaUrl: string;
  projectZipUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    HeaderComponent,
  ],
})
export class HomeComponent implements OnInit {
  homeService = inject(HomeService);
  gistService = inject(GistService);
  readonly dialog = inject(MatDialog);
  router = inject(Router);

  displayedColumns: string[] = ['title', 'description', 'updated', 'operation'];
  dataSource = new MatTableDataSource<Project>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  ngOnInit() {
    this.dataSource.paginator = this.paginator;

    this.getList();
  }

  getList() {
    this.homeService.getList().then((res) => {
      if (res.success) {
        try {
          const isCodeStudioProject = (item: IGistItem) => {
            return item && item.files && item.files[`${PROJECT_KEY}.json`];
          };
          //@ts-ignore
          const _data = res.data
            .filter(isCodeStudioProject)
            .map((item: IGistItem) => transformData(item));
          this.dataSource.data = _data;
        } catch (error) {
          console.log('error', error);
        }
      }
    });

    function transformData(item: IGistItem) {
      const descriptionObj = item.description
        ? parseDescription(item.description)
        : {};
      return {
        id: item.id,
        title: descriptionObj['title'],
        description: descriptionObj['description'],
        updated: formatTime(item.updated_at),
        gistUrl: item.url,
        metaUrl: item.files['codestudio.json']
          ? item.files['codestudio.json'].raw_url
          : '',
        // FIXME:
        projectZipUrl: item.files['project']
          ? item.files['project'].raw_url
          : '',
      } as Project;
    }
  }

  openTemplateModal() {
    this.dialog.open(TemplateModalComponent);
  }

  editProject(project: Project) {
    const queryString = `source=${encodeURIComponent(
      project.projectZipUrl
    )}&terminal=${encodeURIComponent('dev')}`;
    // FIXME: router.navigate has some issue, will fix it later ?
    window.location.href = `${window.location.origin}/edit/?${queryString}`;
  }

  deleteProject(project: Project) {
    this.gistService
      .deleteGist({
        gistId: project.id,
      })
      .then(() => {
        this.getList();
      });
    console.log('Delete project:', project);
  }
}
