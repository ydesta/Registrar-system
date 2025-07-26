import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SemesterRegistrationListComponent } from './semester-registration-list.component';


const routes: Routes = [
  { path: '', component: SemesterRegistrationListComponent },
 ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SemestersRoutingModule { }
