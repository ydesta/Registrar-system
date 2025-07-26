import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NzMessageModule } from 'ng-zorro-antd/message';

import { CourseRoutingModule } from './course-routing.module';
import { CourseComponent } from './course.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { AddCourseComponent } from './add-course/add-course.component';
import { CourseEquivalentComponent } from './course-equivalent/course-equivalent.component';
import { AddCourseEquivalentComponent } from './add-course-equivalent/add-course-equivalent.component';
import { AddCoursePrerequisiteComponent } from './add-course-prerequisite/add-course-prerequisite.component';
import { CoursePrerequisiteComponent } from './course-prerequisite/course-prerequisite.component';
import { NgxPrintModule } from 'ngx-print';
import { CourseService } from 'src/app/services/course.service';
import { CoursePrerequisiteService } from 'src/app/services/course-prerequisite.service';
import { DropCoursesComponent } from './add-drop/drop-courses/drop-courses.component';
import { AddCoursesComponent } from './add-drop/add-courses/add-courses.component';

@NgModule({
  declarations: [
    CourseComponent,
    AddCourseComponent,
    CourseEquivalentComponent,
    AddCourseEquivalentComponent,
    AddCoursePrerequisiteComponent,
    CoursePrerequisiteComponent,
    DropCoursesComponent,
    AddCoursesComponent
  ],
  imports: [
    CommonModule,
    CourseRoutingModule,
    SharedModule,   
    NgxPrintModule,
    HttpClientModule,
    NzMessageModule
  ],
  providers: [
    CourseService,
    CoursePrerequisiteService
  ]
})
export class CourseModule { }
