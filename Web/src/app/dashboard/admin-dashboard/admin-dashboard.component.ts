import { Component, OnInit } from '@angular/core';
import { CrudService } from 'src/app/services/crud.service';

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  currentSemester: string;
  pendingApplications: number;
  graduatesThisYear: number;
  graduatesAllTime: number;
}

interface EnrollmentStats {
  newRegistrations: number;
  departmentBreakdown: any[];
  studentStatus: {
    active: number;
    graduated: number;
    dropped: number;
    suspended: number;
  };
}

interface CourseInsights {
  topEnrolledCourses: any[];
  upcomingClasses: any[];
  coursesWithoutInstructors: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    currentSemester: '',
    pendingApplications: 0,
    graduatesThisYear: 0,
    graduatesAllTime: 0
  };

  enrollmentStats: EnrollmentStats = {
    newRegistrations: 0,
    departmentBreakdown: [],
    studentStatus: {
      active: 0,
      graduated: 0,
      dropped: 0,
      suspended: 0
    }
  };

  courseInsights: CourseInsights = {
    topEnrolledCourses: [],
    upcomingClasses: [],
    coursesWithoutInstructors: []
  };

  constructor(private crudService: CrudService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.crudService.getList('/students').subscribe((res: any) => {
      this.stats.totalStudents = res.data.length;
    });

    this.crudService.getList('/instructors').subscribe((res: any) => {
      this.stats.totalInstructors = res.data.length;
    });

    this.crudService.getList('/courses').subscribe((res: any) => {
      this.stats.totalCourses = res.data.length;
      this.loadCourseInsights(res.data);
    });

    this.crudService.getList('/academicTerms').subscribe((res: any) => {
      const currentTerm = res.data.find((term: any) => term.isCurrent);
      if (currentTerm) {
        this.stats.currentSemester = `${currentTerm.season} ${currentTerm.year}`;
      }
    });

    this.crudService.getList('/applications').subscribe((res: any) => {
      this.stats.pendingApplications = res.data.filter((app: any) => app.status === 'Pending').length;
    });

    this.loadEnrollmentStats();
  }

  loadEnrollmentStats() {
    this.crudService.getList('/departments').subscribe((res: any) => {
      this.enrollmentStats.departmentBreakdown = res.data.map((dept: any) => ({
        name: dept.name,
        value: dept.studentCount || 0
      }));
    });

    this.crudService.getList('/students').subscribe((res: any) => {
      const students = res.data;
      this.enrollmentStats.studentStatus = {
        active: students.filter((s: any) => s.status === 'Active').length,
        graduated: students.filter((s: any) => s.status === 'Graduated').length,
        dropped: students.filter((s: any) => s.status === 'Dropped').length,
        suspended: students.filter((s: any) => s.status === 'Suspended').length
      };
    });
  }

  loadCourseInsights(courses: any[]) {
    this.crudService.getList('/courseEnrollments').subscribe((res: any) => {
      const enrollments = res.data;
      this.courseInsights.topEnrolledCourses = courses
        .map(course => ({
          ...course,
          enrollmentCount: enrollments.filter((e: any) => e.courseId === course.id).length
        }))
        .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
        .slice(0, 5);
    });

    this.courseInsights.coursesWithoutInstructors = courses.filter(course => !course.instructorId);
  }
}
