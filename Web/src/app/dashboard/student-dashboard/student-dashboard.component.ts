import { Component, OnInit } from '@angular/core';
import { CourseView } from '../models/CourseView';
import { AcademicEvent } from '../models/AcademicEvent';
import { Deadline } from '../models/Deadline';
import { KpiCard } from '../models/KpiCard';
import { DashBoardService } from '../services/dash-board.service';
import { GPATrend } from '../models/GPATrend';
import { curveLinear } from 'd3-shape';

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

  // Term Courses
  termCourses: CourseView[] = [
    {
      code: 'CS101',
      name: 'Intro to Programming',
      credits: 3,
      term: 'Summer 2023',
      status: 'Completed'
    },
    {
      code: 'MATH201',
      name: 'Calculus II',
      credits: 4,
      term: 'Summer 2023',
      status: 'In Progress'
    },
    {
      code: 'PHY301',
      name: 'Modern Physics',
      credits: 3,
      term: 'Spring 2024',
      status: 'In Progress'
    },
    {
      code: 'CS202',
      name: 'Data Structures',
      credits: 4,
      term: 'Spring 2024',
      status: 'Completed'
    }
  ];

  termChartData = [
    { name: 'Fall 2023', value: 7 },
    { name: 'Spring 2024', value: 7 }
  ];

  // Top Grades
  topCourses: CourseView[] = [
    {
      code: 'CS101',
      name: 'Intro to Programming',
      credits: 3,
      grade: 4.0,
      term: 'Fall 2023'
    },
    {
      code: 'HIST101',
      name: 'World History',
      credits: 2,
      grade: 3.9,
      term: 'Fall 2023'
    },
    {
      code: 'MATH201',
      name: 'Calculus II',
      credits: 4,
      grade: 3.8,
      term: 'Fall 2023'
    },
    {
      code: 'ENG101',
      name: 'English Composition',
      credits: 3,
      grade: 3.7,
      term: 'Fall 2023'
    },
    {
      code: 'CHEM101',
      name: 'General Chemistry',
      credits: 4,
      grade: 3.6,
      term: 'Fall 2023'
    }
  ];

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

  constructor(private dashBoardService: DashBoardService) {
    this.applicantUserId = localStorage.getItem('userId');
  }

  ngOnInit() {
    // Add delay between API calls to avoid rate limiting
    this.getKpiCards();
    setTimeout(() => {
      this.getListOfGPATrend();
    }, 500);
    this.updateCourseCompletionData();
  }
  getKpiCards() {
    this.dashBoardService.getListOfKpiCards(this.applicantUserId)
      .subscribe({
        next: (data) => {
          this.kpis = data;
        },
        error: (error) => {
          console.error('Error loading KPI cards:', error);
          // You could show a user-friendly error message here
        }
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
        error: (error) => {
          console.error('Error loading GPA trend:', error);
          // You could show a user-friendly error message here
        }
      });
  }
  updateCourseCompletionData() {
    this.courseCompletionData = [
      { name: 'Completed', value: this.termCourses.filter(c => c.status === 'Completed').length },
      { name: 'In Progress', value: this.termCourses.filter(c => c.status === 'In Progress').length }
    ];
  }
}