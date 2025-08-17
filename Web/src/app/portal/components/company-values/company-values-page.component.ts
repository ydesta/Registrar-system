import { Component } from '@angular/core';

@Component({
  selector: 'app-company-values-page',
  templateUrl: './company-values-page.component.html',
  styleUrls: ['./company-values-page.component.scss']
})
export class CompanyValuesPageComponent {
  values = [
    {
      icon: 'bulb',
      title: 'Innovation',
      description: 'We foster creativity and innovative thinking, encouraging students to push boundaries and develop cutting-edge solutions.'
    },
    {
      icon: 'trophy',
      title: 'Excellence',
      description: 'We maintain the highest standards in education, research, and student development, striving for excellence in everything we do.'
    },
    {
      icon: 'team',
      title: 'Collaboration',
      description: 'We believe in the power of teamwork and collaboration, building strong partnerships with industry and academic institutions.'
    },
    {
      icon: 'heart',
      title: 'Integrity',
      description: 'We uphold the highest ethical standards, ensuring transparency, honesty, and accountability in all our endeavors.'
    },
    {
      icon: 'global',
      title: 'Diversity',
      description: 'We celebrate diversity and inclusion, creating an environment where all students feel valued and empowered to succeed.'
    },
    {
      icon: 'rocket',
      title: 'Growth',
      description: 'We are committed to continuous improvement and growth, adapting to the ever-changing landscape of technology.'
    }
  ];
}
