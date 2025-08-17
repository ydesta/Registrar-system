import { Component } from '@angular/core';

@Component({
  selector: 'app-services-page',
  templateUrl: './services-page.component.html',
  styleUrls: ['./services-page.component.scss']
})
export class ServicesPageComponent {
  services = [
    {
      icon: 'experiment',
      title: 'Research & Development',
      description: 'Cutting-edge research in computer science and technology with industry partnerships.'
    },
    {
      icon: 'read',
      title: 'Academic Programs',
      description: 'Comprehensive undergraduate and graduate programs in computer science and engineering.'
    },
    {
      icon: 'team',
      title: 'Industry Collaboration',
      description: 'Strong partnerships with leading technology companies for internships and job placement.'
    },
    {
      icon: 'bulb',
      title: 'Innovation Hub',
      description: 'State-of-the-art facilities for students to develop and test their innovative ideas.'
    },
    {
      icon: 'global',
      title: 'International Exchange',
      description: 'Global learning opportunities through international partnerships and exchange programs.'
    },
    {
      icon: 'trophy',
      title: 'Competition Programs',
      description: 'Participation in national and international coding competitions and hackathons.'
    }
  ];
}
