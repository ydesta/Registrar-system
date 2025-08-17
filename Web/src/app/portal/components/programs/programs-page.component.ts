import { Component } from '@angular/core';

@Component({
  selector: 'app-programs-page',
  templateUrl: './programs-page.component.html',
  styleUrls: ['./programs-page.component.scss']
})
export class ProgramsPageComponent {
  programs = [
    {
      icon: 'experiment',
      title: 'Bachelor of Science in Computer Science',
      description: 'A comprehensive program covering fundamental computer science principles, algorithms, data structures, and software development.',
      duration: '4 Years',
      level: 'Undergraduate',
      features: [
        'Core computer science fundamentals',
        'Programming and software development',
        'Database design and management',
        'Web and mobile application development',
        'Team-based project development and deployment'
      ]
    },
    {
      icon: 'read',
      title: 'Bachelor of Science in Software Engineering',
      description: 'Focused on software development methodologies, project management, and building scalable software solutions.',
      duration: '4 Years',
      level: 'Undergraduate',
      features: [
        'Software development lifecycle',
        'Agile and DevOps methodologies',
        'Software testing and quality assurance',
        'Cloud computing and deployment',
        'Software project and team management'
      ]
    },
    {
      icon: 'bulb',
      title: 'Master of Science in Computer Science',
      description: 'Advanced studies in computer science with focus on research, innovation, and specialized areas.',
      duration: '2 Years',
      level: 'Graduate',
      features: [
        'Advanced algorithms and complexity',
        'Machine learning and AI',
        'Research methodology',
        'Specialized electives',
        'Thesis or capstone project'
      ]
    },
    {
      icon: 'trophy',
      title: 'Master of Science in Information Technology',
      description: 'Professional program focusing on IT management, enterprise systems, and technology leadership.',
      duration: '2 Years',
      level: 'Graduate',
      features: [
        'IT management and leadership',
        'Enterprise architecture',
        'Cybersecurity and risk management',
        'Data analytics and business intelligence',
        'Professional portfolio development'
      ]
    }
  ];
}
