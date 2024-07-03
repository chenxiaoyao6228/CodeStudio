import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './components/header/header.component';
import { MatDialog } from '@angular/material/dialog';
import { TemplateModalComponent } from '../_shared/components/template-modal/template-modal.component';

export interface Project {
  title: string;
  description: string;
  updated: string;
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
    HeaderComponent
  ]
})
export class HomeComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  displayedColumns: string[] = ['title', 'description', 'updated', 'operation'];
  dataSource = new MatTableDataSource<Project>([
    {
      title: 'Angular Starter',
      description: 'An angular-cli project based on @angular/animations, @angular/common,...',
      updated: '7 minutes ago'
    },
    {
      title: 'node.new Starter',
      description: 'Starter project for Node.js, a JavaScript runtime built on Chrome\'s V8 JavaScript engine',
      updated: 'about 23 hours ago'
    },
    {
      title: 'Vitejs - Vite (forked)',
      description: 'Next generation frontend tooling. It\'s fast!',
      updated: 'about 24 hours ago'
    }

  ]);

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
  }


  openTemplateModal() {
    this.dialog.open(TemplateModalComponent)
  }

  editProject(project: Project) {

    console.log('Edit project:', project);
  }

  deleteProject(project: Project) {

    console.log('Delete project:', project);
  }
}
