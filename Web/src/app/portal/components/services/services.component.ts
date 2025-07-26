import { Component, OnInit } from '@angular/core';

interface Service {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  services: Service[] = [
    {
      title: 'Post Graduate',
      description: 'Advanced studies in Computer Science and Technology',
      icon: 'experiment'
    },
    {
      title: 'Under Graduate',
      description: 'Comprehensive degree programs in IT and Computing',
      icon: 'read'
    },
    {
      title: 'Research',
      description: 'Cutting-edge research opportunities in technology',
      icon: 'solution'
    },
    {
      title: 'Training',
      description: 'Professional development and certification programs',
      icon: 'trophy'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
} 