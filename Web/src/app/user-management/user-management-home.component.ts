import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface QuickLinkItem {
  title: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-user-management-home',
  templateUrl: './user-management-home.component.html',
  styleUrls: ['./user-management-home.component.scss']
})
export class UserManagementHomeComponent implements OnInit {
  quickLinks: QuickLinkItem[] = [
    {
      title: 'Manage Users',
      description: 'View, create, and manage user accounts',
      route: '/user-management/users',
      icon: 'team'
    },
    {
      title: 'Manage Roles',
      description: 'Create and configure user roles',
      route: '/user-management/roles',
      icon: 'safety-certificate'
    },
    {
      title: 'Manage Permissions',
      description: 'Configure system permissions',
      route: '/user-management/permissions',
      icon: 'key'
    },
    {
      title: 'User Activity',
      description: 'Monitor user activity logs',
      route: '/user-management/activity',
      icon: 'audit'
    },
    {
      title: 'Suspicious Activity',
      description: 'Monitor and analyze suspicious activities',
      route: '/user-management/suspicious-activity',
      icon: 'warning'
    },
    {
      title: 'User Credentials',
      description: 'View and manage user credentials',
      route: '/user-management/credentials',
      icon: 'database'
    },
    {
      title: 'Update from Excel',
      description: 'Bulk update users (firstName, lastName, username) from Excel',
      route: '/user-management/update-from-excel',
      icon: 'file-excel'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.navigate(['/user-management/users']);
  }

  navigateToRoute(route: string): void {
    this.router.navigate([route]);
  }

  getPageTitle(): string {
    return 'User Management';
  }

  getPageDescription(): string {
    return 'Welcome to the User Management system. Please select an option from the sidebar or use the navigation below.';
  }
}
