import { Component } from '@angular/core';

interface CompanyValue {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-company-values',
  templateUrl: './company-values.component.html',
  styleUrls: ['./company-values.component.scss']
})
export class CompanyValuesComponent {
  values: CompanyValue[] = [
    {
      title: 'Our Mission',
      description: 'To empower individuals through innovative education and cutting-edge technology, fostering a community of lifelong learners prepared for the challenges of tomorrow.',
      icon: 'aim'
    },
    {
      title: 'Our Vision',
      description: 'To be a global leader in technology education, pioneering new ways of learning and creating positive impact through excellence in teaching, research, and innovation.',
      icon: 'eye'
    },
    {
      title: 'Our Values',
      description: 'Excellence, Innovation, Integrity, Collaboration, and Inclusivity form the foundation of our commitment to transformative education and sustainable development.',
      icon: 'heart'
    }
  ];
}
