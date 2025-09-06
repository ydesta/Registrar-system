import { CourseViewModel } from "../students/models/course-break-down-offering.model";
import { BatchCodeListViewModel } from "./BatchCodeListViewModel";
import { SectionViewModel } from "./SectionViewModel";

export interface StaffTeachingDataViewModel {
  sections: SectionViewModel[];      
  batches: BatchCodeListViewModel[];
  courses: CourseViewModel[];        
}