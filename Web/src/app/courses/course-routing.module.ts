import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddCourseEquivalentComponent } from './add-course-equivalent/add-course-equivalent.component';
import { AddCoursePrerequisiteComponent } from './add-course-prerequisite/add-course-prerequisite.component';
import { AddCourseComponent } from './add-course/add-course.component';
import { CourseEquivalentComponent } from './course-equivalent/course-equivalent.component';
import { CoursePrerequisiteComponent } from './course-prerequisite/course-prerequisite.component';
import { CourseComponent } from './course.component';
import { CourseExemptionListComponent } from './course-exemption-list/course-exemption-list.component';
import { CourseExemptionFormComponent } from './course-exemption-form/course-exemption-form.component';

const routes: Routes = [
  { path: '', component: CourseComponent },
{ path: 'add-course/:id', component: AddCourseComponent },
{ path: 'course-equivalent', component: CourseEquivalentComponent },
{ path: 'add-course-equivalent/:id', component: AddCourseEquivalentComponent },
{ path: 'course-prerequisite', component: CoursePrerequisiteComponent },
{ path: 'add-course-prerequisite/:id', component: AddCoursePrerequisiteComponent },
{ path: 'course-exemption-list', component: CourseExemptionListComponent },
{ path: 'course-exemption-form', component: CourseExemptionFormComponent },
{ path: 'course-exemption-form/:id', component: CourseExemptionFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CourseRoutingModule { }
