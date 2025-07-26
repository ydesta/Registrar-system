import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalComponent } from './portal.component';
import { RegisterComponent } from '../register/register.component';
import { AboutCollegeComponent } from './components/about-college/about-college.component';
import { ContactComponent } from './components/contact/contact.component';
import { ProgramsComponent } from './components/programs/programs.component';

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
    component: ProgramsComponent 
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PortalRoutingModule { } 