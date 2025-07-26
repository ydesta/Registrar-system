import { Component } from '@angular/core';

@Component({
  selector: 'app-user-management',
  template: `
    <div class="user-management-container">
      <h2>User Management</h2>
      <p>Welcome to the User Management system. Please select an option from the sidebar or use the navigation below.</p>
      
      <div class="quick-links">
        <a routerLink="/user-management/users" class="quick-link">
          <i nz-icon nzType="team"></i>
          <span>Manage Users</span>
        </a>
        <a routerLink="/user-management/roles" class="quick-link">
          <i nz-icon nzType="safety-certificate"></i>
          <span>Manage Roles</span>
        </a>
        <a routerLink="/user-management/permissions" class="quick-link">
          <i nz-icon nzType="key"></i>
          <span>Manage Permissions</span>
        </a>
        <a routerLink="/user-management/activity" class="quick-link">
          <i nz-icon nzType="audit"></i>
          <span>User Activity</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 24px;
    }
    
    .quick-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    
    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      background: #f5f5f5;
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: all 0.3s;
    }
    
    .quick-link:hover {
      background: #e6f7ff;
      color: #1890ff;
    }
    
    .quick-link i {
      font-size: 24px;
      margin-bottom: 8px;
    }
  `]
})
export class UserManagementComponent {} 