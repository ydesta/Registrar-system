import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseView } from '../models/CourseView';
import { AcademicEvent } from '../models/AcademicEvent';
import { Deadline } from '../models/Deadline';
import { KpiCard } from '../models/KpiCard';
import { DashBoardService } from '../services/dash-board.service';
import { StudentService } from 'src/app/students/services/student.service';
import { BatchTermService } from 'src/app/colleges/services/batch-term.service';
import { StudentViewModel } from 'src/app/students/models/student-view-model.model';
import { GPATrend } from '../models/GPATrend';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { curveLinear } from 'd3-shape';
import { StudentSummary } from '../models/StudentSummary';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  curveLinear = curveLinear;
  kpis: KpiCard[] = [];
  listOfGPATrend: GPATrend[] = [];

  // GPA Data
  gpaData = [
    { name: 'Major GPA', value: 3.75 },
    { name: 'CGPA', value: 3.68 }
  ];

  gpaTrend = [
    {
      name: 'GPA Trend',
      series: []
    }
  ];

  // Term Courses - Now loaded from API
  termCourses: CourseView[] = [];
  isLoadingCourses: boolean = false;

  termChartData = [
    { name: 'Fall 2023', value: 7 },
    { name: 'Spring 2024', value: 7 }
  ];

  // Top Grades - Now loaded from API
  topCourses: CourseView[] = [];

  // Student Summary
  studentSummary: StudentSummary | null = null;

  // Next Term Courses
  nextTermCourses: CourseView[] = [
    {
      code: 'CS301',
      name: 'Algorithms',
      credits: 4,
      term: 'Fall 2024',
      prerequisites: ['CS201']
    },
    {
      code: 'MATH301',
      name: 'Linear Algebra',
      credits: 3,
      term: 'Fall 2024',
      prerequisites: ['MATH201']
    },
    {
      code: 'PHY302',
      name: 'Quantum Physics',
      credits: 4,
      term: 'Fall 2024',
      prerequisites: ['PHY301']
    }
  ];

  // Chart Colors
  trendColors = [{ name: 'GPA Trend', value: '#1890ff' }];
  barColors = [{ name: 'Credits', value: '#722ed1' }];
  pieColors = [
    { name: 'Major GPA', value: '#1890ff' },
    { name: 'CGPA', value: '#52c41a' }
  ];
  completionColors = [
    { name: 'Completed', value: '#52c41a' },
    { name: 'In Progress', value: '#faad14' }
  ];

  // Course Completion Data for Pie Chart
  courseCompletionData = [
    { name: 'Completed', value: 0 },
    { name: 'In Progress', value: 0 }
  ];

  // Academic Events Data
  academicEvents: AcademicEvent[] = [
    {
      title: 'Orientation Week',
      date: 'Aug 28 - Sep 1',
      description: 'Welcome week for new students with campus tours and program introductions.',
      location: 'Main Campus',
      color: 'blue',
      tagColor: 'blue'
    },
    {
      title: 'Course Registration Deadline',
      date: 'Sep 5',
      description: 'Last day to register for Fall semester courses.',
      color: 'green',
      tagColor: 'green'
    },
    {
      title: 'Finalterm Advising',
      date: 'Sep 12',
      description: 'First round of examinations for all courses.',
      color: 'red',
      tagColor: 'orange'
    },
    {
      title: 'Midterm Examinations',
      date: 'Oct 15-20',
      description: 'First round of examinations for all courses.',
      color: 'grey',
      tagColor: 'purple'
    }
  ];

  // Deadlines Data
  deadlines: Deadline[] = [
    {
      title: 'Research Paper Submission',
      date: 'Due in 5 days',
      icon: 'file-text',
      iconTheme: 'outline',
      iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)',
      progress: 75,
      progressStatus: 'active',
      progressColor: '#1890ff',
      status: 'In Progress',
      statusColor: 'processing'
    },
    {
      title: 'Group Project Presentation',
      date: 'Due in 2 weeks',
      icon: 'team',
      iconTheme: 'outline',
      iconBg: 'linear-gradient(135deg, #52c41a, #389e0d)',
      progress: 30,
      progressStatus: 'active',
      progressColor: '#52c41a',
      status: 'Started',
      statusColor: 'success'
    },
    {
      title: 'Final Project Proposal',
      date: 'Due in 3 weeks',
      icon: 'project',
      iconTheme: 'outline',
      iconBg: 'linear-gradient(135deg, #fa8c16, #d46b08)',
      progress: 0,
      progressStatus: 'exception',
      progressColor: '#fa8c16',
      status: 'Not Started',
      statusColor: 'warning'
    }
  ];

  applicantUserId: string | null = null;
  studentCode: string | null = null;
  nextAcademicTerm: any = null;
  academicTermId: number = 0;
  listOfTermNumber: StaticData[] = [];

  constructor(
    private dashBoardService: DashBoardService,
    private studentService: StudentService,
    private batchTermService: BatchTermService,
    private router: Router
  ) {
    this.applicantUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    this.studentCode = localStorage.getItem('studentCode');
  }

  ngOnInit() {
    this.getListOfAcademicTermStatus();
    this.getKpiCards();
    setTimeout(() => {
      this.getListOfGPATrend();
    }, 500);
    setTimeout(() => {
      this.getCourseCompletion();
    }, 1000);
    setTimeout(() => {
      this.getTopCourses();
    }, 1500);
    setTimeout(() => {
      this.getStudentSummary();
    }, 2000);
    
    const next = sessionStorage.getItem('nextAcademicTerm');
    this.nextAcademicTerm = next ? JSON.parse(next) : null;

    if (this.nextAcademicTerm) {
      this.academicTermId = this.nextAcademicTerm.termId;
      this.loadStudentCourseOfferings();
    } else {
      this.getNextAcademicTerm();
    }
  }
  getKpiCards() {
    this.dashBoardService.getListOfKpiCards(this.applicantUserId)
      .subscribe({
        next: (data) => {
          this.kpis = data;
        },
        error: () => {}
      });
  }
  
  getListOfGPATrend() {
    this.dashBoardService.getListOfGPATrend(this.applicantUserId)
      .subscribe({
        next: (data) => {
          this.listOfGPATrend = data;
          this.gpaTrend = [
            {
              name: 'GPA Trend',
              series: this.listOfGPATrend
            }
          ];
        },
        error: () => {}
      });
  }
  getNextAcademicTerm() {
    this.batchTermService.getNextAcademicTerm().subscribe({
      next: (res: any) => {
        this.nextAcademicTerm = res;
        this.academicTermId = res.termId;
        sessionStorage.setItem('nextAcademicTerm', JSON.stringify(res));
        this.loadStudentCourseOfferings();
      },
      error: () => {
        this.isLoadingCourses = false;
      }
    });
  }

  loadStudentCourseOfferings() {
    if (!this.applicantUserId || !this.nextAcademicTerm || !this.academicTermId) {
      this.isLoadingCourses = false;
      return;
    }

    this.isLoadingCourses = true;
    this.studentService.getStudentCourseOfferingId(
      this.applicantUserId,
      this.academicTermId,
      this.nextAcademicTerm.id
    ).subscribe({
      next: (data: StudentViewModel) => {
        if (data && data.courseTermOfferings) {
          const displayYear = this.nextAcademicTerm?.year || data.academicTermYear;
          this.termCourses = data.courseTermOfferings.map(course => ({
            code: course.courseCode,
            name: course.courseTitle,
            credits: course.creditHours,
            term: `${this.getTermName(data.academicTermSeason)} ${displayYear}`,
            status: course.isRegistered ? 'In Progress' : 'Not Registered'
          }));
        }
        this.isLoadingCourses = false;
      },
      error: () => {
        this.isLoadingCourses = false;
      }
    });
  }

  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach((pair) => {
      division = {
        Id: pair.Id,
        Description: pair.Description,
      };
      this.listOfTermNumber.push(division);
    });
  }

  getTermName(season: number): string {
    const term = this.listOfTermNumber.find((item) => item.Id === season);
    return term ? term.Description : 'Unknown';
  }

  getCourseCompletion() {
    this.dashBoardService.getCourseCompletion(this.applicantUserId).subscribe({
      next: (data) => {
        if (data && data.length >= 2) {
          this.courseCompletionData = data.map(item => ({
            name: item.name,
            value: item.value
          }));
        }
      },
      error: () => {}
    });
  }

  getTopCourses() {
    this.dashBoardService.getTopCourses(this.applicantUserId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.topCourses = data.map(course => ({
            code: course.code,
            name: course.name,
            credits: course.credits,
            term: course.term,
            grade: course.grade
          }));
        }
      },
      error: () => {}
    });
  }

  getStudentSummary() {
    this.dashBoardService.getStudentSummary(this.applicantUserId).subscribe({
      next: (data) => {
        if (data) {
          this.studentSummary = data;
        }
      },
      error: () => {}
    });
  }

  viewCourseOffering() {
    this.router.navigate(['/colleges/term-course-offering']);
  }
}