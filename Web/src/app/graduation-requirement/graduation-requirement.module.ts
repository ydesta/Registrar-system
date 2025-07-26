import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GraduationRequirementRoutingModule } from './graduation-requirement-routing.module';
import { GraduationRequirementComponent } from './graduation-requirement.component';
import { RequirementQuandrantComponent } from './requirement-quandrant/requirement-quandrant.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { AddRequirementComponent } from './add-requirement/add-requirement.component';
import { AddRequirementQuadrantComponent } from './add-requirement-quadrant/add-requirement-quadrant.component';
import { QuadrantComponent } from './quadrant/quadrant.component';
import { AddQuadrantComponent } from './add-quadrant/add-quadrant.component';
import { AddCurriculumQuadrantBreakdownComponent } from './add-curriculum-quadrant-breakdown/add-curriculum-quadrant-breakdown.component';
import { CurriculumQuadrantBreakdownComponent } from './curriculum-quadrant-breakdown/curriculum-quadrant-breakdown.component';
import { NgxPrintModule } from 'ngx-print';


@NgModule({
  declarations: [
    GraduationRequirementComponent,
    RequirementQuandrantComponent,
    AddRequirementComponent,
    AddRequirementQuadrantComponent,
    QuadrantComponent,
    AddQuadrantComponent,
    AddCurriculumQuadrantBreakdownComponent,
    CurriculumQuadrantBreakdownComponent
  ],
  imports: [
    CommonModule,
    GraduationRequirementRoutingModule,
    SharedModule,      
    NgxPrintModule
  ]
})
export class GraduationRequirementModule { }
