import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalComponent } from './portal.component';
import { AboutCollegeComponent } from './components/about-college/about-college.component';
import { ContactComponent } from './components/contact/contact.component';
import { ProgramsPageComponent } from './components/programs/programs-page.component';
import { ServicesPageComponent } from './components/services/services-page.component';
import { CompanyValuesPageComponent } from './components/company-values/company-values-page.component';

const routes: Routes = [
  { 
    path: '', 
    component: PortalComponent 
  },
  { 
    path: 'about', 
    component: AboutCollegeComponent 
  },
  { 
    path: 'contact', 
    component: ContactComponent 
  },
  // { 
  //   path: 'register', 
  //   component: RegisterComponent 
  // },
  { 
    path: 'programs', 
    component: ProgramsPageComponent 
  },
  { 
    path: 'services', 
    component: ServicesPageComponent 
  },
  { 
    path: 'values', 
    component: CompanyValuesPageComponent 
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PortalRoutingModule { } 