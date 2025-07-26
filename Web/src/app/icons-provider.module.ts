import { NgModule } from '@angular/core';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';

import {
  MenuFoldOutline,
  MenuUnfoldOutline,
  FormOutline,
  DashboardOutline,
  EyeOutline,
  EditOutline,
  DeleteOutline,
  ClockCircleOutline,
  TrophyOutline,
  CheckCircleOutline,
  FacebookOutline,
  TwitterOutline,
  LinkedinOutline,
  InstagramOutline,
  YoutubeOutline,
  MessageOutline,
  ExclamationCircleOutline,
  FileTextOutline,
  AppstoreOutline
} from '@ant-design/icons-angular/icons';

const icons = [
  MenuFoldOutline, 
  MenuUnfoldOutline, 
  DashboardOutline, 
  FormOutline,
  EyeOutline,
  EditOutline,
  DeleteOutline,
  ClockCircleOutline,
  TrophyOutline,
  CheckCircleOutline,
  FacebookOutline,
  TwitterOutline,
  LinkedinOutline,
  InstagramOutline,
  YoutubeOutline,
  MessageOutline,
  ExclamationCircleOutline,
  FileTextOutline,
  AppstoreOutline
];

@NgModule({
  imports: [NzIconModule],
  exports: [NzIconModule],
  providers: [
    { provide: NZ_ICONS, useValue: icons }
  ]
})
export class IconsProviderModule {
}
