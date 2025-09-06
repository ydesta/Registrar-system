import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { 
  ExperimentOutline, 
  ReadOutline,
  FacebookOutline,
  TwitterOutline,
  InstagramOutline,
  LinkedinOutline,
  MessageOutline,
  PhoneOutline,
  MailOutline,
  EnvironmentOutline,
  TeamOutline,
  HeartOutline,
  RocketOutline,
  BulbOutline,
  TrophyOutline,
  GlobalOutline,
  StarOutline,
  StarFill,
  CheckCircleOutline,
  CheckCircleFill,
  ClockCircleOutline,
  TrophyFill
} from '@ant-design/icons-angular/icons';

import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { ServicesComponent } from './components/services/services.component';
import { ServicesPageComponent } from './components/services/services-page.component';
import { AboutCollegeComponent } from './components/about-college/about-college.component';
import { HomeSliderComponent } from './components/home-slider/home-slider.component';
import { CompanyValuesComponent } from './components/company-values/company-values.component';
import { CompanyValuesPageComponent } from './components/company-values/company-values-page.component';
import { EventSliderComponent } from './components/event-slider/event-slider.component';
import { ContactComponent } from './components/contact/contact.component';
import { ProgramsComponent } from './components/programs/programs.component';
import { ProgramsPageComponent } from './components/programs/programs-page.component';
import { LoginComponent } from '../accounts/login/login.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const icons = [
  ExperimentOutline,
  ReadOutline,
  FacebookOutline,
  TwitterOutline,
  InstagramOutline,
  LinkedinOutline,
  MessageOutline,
  PhoneOutline,
  MailOutline,
  EnvironmentOutline,
  TeamOutline,
  HeartOutline,
  RocketOutline,
  BulbOutline,
  TrophyOutline,
  GlobalOutline,
  StarOutline,
  StarFill,
  CheckCircleOutline,
  CheckCircleFill,
  ClockCircleOutline,
  TrophyFill
];

@NgModule({
  declarations: [
    PortalComponent,
    ServicesComponent,
    ServicesPageComponent,
    AboutCollegeComponent,
    HomeSliderComponent,
    CompanyValuesComponent,
    CompanyValuesPageComponent,
    EventSliderComponent,
    ContactComponent,
    ProgramsComponent,
    ProgramsPageComponent,
    // LoginComponent,
    // RegisterComponent
  ],
  imports: [
    CommonModule,
    PortalRoutingModule,
    RouterModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzGridModule,
    NzCardModule,
    NzCarouselModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NzIconModule.forChild(icons)
  ],
  exports: [
    PortalComponent,
    ServicesComponent,
    AboutCollegeComponent,
    HomeSliderComponent,
    CompanyValuesComponent,
    EventSliderComponent,
    ContactComponent,
    ProgramsComponent,
    // LoginComponent,
    // RegisterComponent
  ]

})
export class PortalModule { } 