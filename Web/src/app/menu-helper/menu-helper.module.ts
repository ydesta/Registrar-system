import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuHelperComponent } from './menu-helper/menu-helper.component';
import { MainModule } from '../main/main.module';
import { Router, RouterModule } from '@angular/router';

export const routes = [
  {
    path: '',
    Component: MenuHelperComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../main/main.module').then((m) => m.MainModule),
      },
    ],
  },
];

@NgModule({
  declarations: [MenuHelperComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MainModule],
})
export class MenuHelperModule {}
