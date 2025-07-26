import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddCurriculumQuadrantBreakdownComponent } from './add-curriculum-quadrant-breakdown/add-curriculum-quadrant-breakdown.component';
import { AddQuadrantComponent } from './add-quadrant/add-quadrant.component';
import { AddRequirementQuadrantComponent } from './add-requirement-quadrant/add-requirement-quadrant.component';
import { AddRequirementComponent } from './add-requirement/add-requirement.component';
import { CurriculumQuadrantBreakdownComponent } from './curriculum-quadrant-breakdown/curriculum-quadrant-breakdown.component';
import { GraduationRequirementComponent } from './graduation-requirement.component';
import { QuadrantComponent } from './quadrant/quadrant.component';
import { RequirementQuandrantComponent } from './requirement-quandrant/requirement-quandrant.component';

const routes: Routes = [{ path: '', component: GraduationRequirementComponent },
{path:'quandrant-requirement',component:RequirementQuandrantComponent},
{path:'add-requirement/:id',component:AddRequirementComponent},
{path:'add-requirement-quadrant/:id',component:AddRequirementQuadrantComponent},
{path:'quadrant',component:QuadrantComponent},
{path:'cuadrant-breakdown',component:CurriculumQuadrantBreakdownComponent},
{path:'add-quadrant/:id',component:AddQuadrantComponent},
{path:'add-cuadrant-breakdown/:id',component:AddCurriculumQuadrantBreakdownComponent}



];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GraduationRequirementRoutingModule { }
