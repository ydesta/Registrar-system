import { Component, OnInit } from '@angular/core';

interface Program {
  icon: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  features: string[];
}

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.scss']
})
export class ProgramsComponent implements OnInit {
  programs: Program[] = [
    {
      icon: 'dashboard',
      title: 'Diploma in Computer Science',
      description: 'A foundational program focused on practical and theoretical aspects of computer science, designed to equip students with essential technical skills for entry-level IT roles.',
      duration: '2–3 Years',
      level: 'Diploma',
      features: [
        'Basic programming and logic building',
        'Computer hardware and networking',
        'Introduction to databases',
        'Fundamentals of web development',
        'IT support and troubleshooting skills'
      ]
    }
,    
    {
      icon: 'code',
      title: 'Bachelor of Science in Computer Science',
      description: 'A comprehensive program covering fundamental and advanced topics in computer science, preparing students for diverse careers in technology.',
      duration: '4 Years',
      level: 'Undergraduate',
      features: [
        'Core programming and algorithms',
        'Software engineering principles',
        'Database management systems',
        'Artificial intelligence basics',
        'Web development technologies'
      ]
    },
    {
      icon: 'codepen-circle',
      title: 'Master of Science in Software Engineering',
      description: 'Advanced program focusing on software development methodologies, project management, and cutting-edge technologies.',
      duration: '2 Years',
      level: 'Graduate',
      features: [
        'Advanced software architecture',
        'Agile development practices',
        'Cloud computing technologies',
        'DevOps methodologies',
        'Enterprise application development'
      ]
    },
    {
      icon: 'control',
      title: 'Postgraduate Diploma in Computer Science',
      description: 'An advanced-level program designed for graduates aiming to deepen their knowledge in computer science or transition into the tech industry from other disciplines.',
      duration: '1 Year',
      level: 'Postgraduate',
      features: [
        'Advanced programming techniques',
        'Data structures and algorithms',
        'Software architecture and design',
        'Machine learning fundamentals',
        'Research methods in computer science'
      ]
    },    
    {
      icon: 'mac-command',
      title: 'Bachelor of Science in Software Engineering',
      description: 'A specialized undergraduate program focused on the systematic design, development, testing, and maintenance of software systems, preparing students for professional software engineering careers.',
      duration: '4 Years',
      level: 'Undergraduate',
      features: [
        'Software development lifecycle (SDLC)',
        'Object-oriented programming and design',
        'Agile and DevOps practices',
        'Software quality assurance and testing',
        'Team-based project development and deployment'
      ]
    },
    {
      icon: 'appstore',
      title: 'Master of Science in Software Engineering',
      description: 'An advanced graduate program aimed at developing high-level expertise in software architecture, engineering methodologies, and modern development practices for scalable and reliable systems.',
      duration: '2 Years',
      level: 'Postgraduate',
      features: [
        'Advanced software architecture and design patterns',
        'Scalable cloud-native application development',
        'Software project and team management',
        'Secure software engineering practices',
        'Research and thesis in emerging software technologies'
      ]
    }
    
    
  ];

  constructor() { }

  ngOnInit(): void {
  }
} 