import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-card-templates',
  templateUrl: './card-templates.component.html',
  styleUrls: ['./card-templates.component.scss']
})
export class CardTemplatesComponent implements OnInit {
  templates: any[] = [];
  loading = false;

  constructor(
    private crud: CrudService,
    private notify: CustomNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.crud.getList('/card-templates').subscribe({
      next: (res: any) => {
        this.loading = false;
        this.templates = res?.data || [];
      },
      error: () => {
        this.loading = false;
        this.templates = [];
      }
    });
  }

  create(): void {
    this.router.navigateByUrl('/students/card-template-designer');
  }

  edit(row: any): void {
    this.router.navigateByUrl(`/students/card-template-designer/${row.id}`);
  }

  setDefault(row: any): void {
    this.crud.add(`/card-templates/${row.id}/set-default`, {}).subscribe({
      next: (res: any) => {
        if (res?.status === 'success') {
          this.notify.notification('success', 'Success', 'Default template updated');
          this.load();
        } else {
          this.notify.notification('error', 'Error', res?.data || 'Failed');
        }
      }
    });
  }

  duplicate(row: any): void {
    this.crud.add(`/card-templates/${row.id}/duplicate`, {}).subscribe({
      next: (res: any) => {
        if (res?.status === 'success') {
          this.notify.notification('success', 'Success', 'Template duplicated');
          this.load();
        } else {
          this.notify.notification('error', 'Error', res?.data || 'Failed');
        }
      }
    });
  }

  orientationLabel(o: number | string): string {
    if (o === 1 || o === 'Portrait') return 'Portrait';
    return 'Landscape';
  }
}
