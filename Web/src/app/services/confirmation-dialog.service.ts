import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';

export interface ConfirmationDialogOptions {
  title: string;
  titleIcon?: string;
  titleColor?: string;
  content: string;
  userInfo?: {
    firstName: string;
    lastName: string;
    id: string;
    email: string;
  };
  infoSections?: Array<{
    type: 'info' | 'warning' | 'success' | 'error';
    icon: string;
    title: string;
    description: string;
    color?: string;
  }>;
  okText?: string;
  cancelText?: string;
  okIcon?: string;
  cancelIcon?: string;
  okType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  okDanger?: boolean;
  width?: number;
  maskClosable?: boolean;
  closable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(private modal: NzModalService) {}

  showConfirmation(options: ConfirmationDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const modalRef = this.modal.confirm({
        nzTitle: this.createTitle(options),
        nzContent: this.createContent(options),
        nzOkText: options.okText || 'Confirm',
        nzCancelText: options.cancelText || 'Cancel',
        nzOkType: options.okType || 'primary',
        nzOkDanger: options.okDanger || false,
        nzWidth: options.width || 500,
        nzMaskClosable: options.maskClosable !== undefined ? options.maskClosable : false,
        nzClosable: options.closable !== undefined ? options.closable : true,
        nzOnOk: () => {
          resolve(true);
        },
        nzOnCancel: () => {
          resolve(false);
        }
      });
    });
  }

  private createTitle(options: ConfirmationDialogOptions): string {
    const icon = options.titleIcon || 'question-circle';
    const color = options.titleColor || '#1890ff';
    return `
      <div style="background: linear-gradient(90deg, ${color} 0%, #e0e7ef 100%); border-radius: 12px 12px 0 0; padding: 18px 24px 14px 24px; display: flex; align-items: center; gap: 16px;">
        <span nz-icon nzType="${icon}" nzTheme="outline" style="font-size: 28px; color: #fff; background: ${color}; border-radius: 50%; padding: 8px;"></span>
        <span style="font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">${options.title}</span>
      </div>
      <div style="height: 2px; background: #e5e7eb; margin-bottom: 8px;"></div>
    `;
  }

  private createContent(options: ConfirmationDialogOptions): string {
    let content = `<div style="padding: 16px 0;">`;
    // Add main content
    if (options.content) {
      content += `
        <div style="margin-bottom: 20px; padding: 18px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 14px; border-left: 5px solid #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.07);">
          <div style="color: #374151; font-size: 15px; line-height: 1.7; font-weight: 500;">${options.content}</div>
        </div>
      `;
    }
    // Add user info card if provided
    if (options.userInfo) {
      content += this.createUserInfoCard(options.userInfo);
    }
    // Add info sections if provided
    if (options.infoSections && options.infoSections.length > 0) {
      options.infoSections.forEach(section => {
        content += this.createInfoSection(section);
      });
    }
    content += `</div>`;
    return content;
  }

  private createUserInfoCard(userInfo: any): string {
    return `
      <div style="background: #fff; border-radius: 14px; box-shadow: 0 2px 12px rgba(24,144,255,0.08); padding: 18px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 18px;">
        <span style='display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1890ff 0%,#096dd9 100%);color:#fff;font-weight:700;font-size:22px;box-shadow:0 2px 8px rgba(24,144,255,0.12);'>${userInfo.firstName.charAt(0)}</span>
        <div>
          <div style="font-weight: 700; color: #22223b; font-size: 18px;">${userInfo.firstName} ${userInfo.lastName}</div>
          <div style="color: #6b7280; font-size: 14px; margin-top: 2px;">User ID: ${userInfo.id}</div>
          <div style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 14px; margin-top: 2px;">
            <span nz-icon nzType="mail" nzTheme="outline"></span>
            <span>${userInfo.email}</span>
          </div>
        </div>
      </div>
    `;
  }

  private createInfoSection(section: any): string {
    const colors = {
      info: { bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '#1890ff', text: '#1e40af' },
      warning: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#f59e0b', text: '#92400e' },
      success: { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '#10b981', text: '#065f46' },
      error: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '#ef4444', text: '#991b1b' }
    };
    const colorScheme = colors[section.type] || colors.info;
    return `
      <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: ${colorScheme.bg}; border-radius: 12px; border-left: 6px solid ${colorScheme.border}; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(24,144,255,0.04);">
        <span nz-icon nzType="${section.icon}" nzTheme="outline" style="color: ${colorScheme.border}; font-size: 22px; margin-top: 2px;"></span>
        <div>
          <div style="font-weight: 700; color: ${colorScheme.text}; margin-bottom: 4px; font-size: 16px;">${section.title}</div>
          <div style="color: ${colorScheme.text}; font-size: 14.5px; opacity: 0.95;">${section.description}</div>
        </div>
      </div>
    `;
  }

  // Convenience methods for common confirmation types
  showPasswordRegeneration(userInfo: any): Promise<boolean> {
    return this.showConfirmation({
      title: 'Regenerate Password',
      titleIcon: 'key',
      titleColor: '#1890ff',
      content: 'A new secure password will be generated and sent to the user\'s email address.',
      userInfo: userInfo,
      infoSections: [
        {
          type: 'warning',
          icon: 'exclamation-circle',
          title: 'Important Note',
          description: 'The user will receive an email with their new login credentials. They should change their password upon first login.'
        }
      ],
      okText: 'Yes, Regenerate Password',
      cancelText: 'Cancel',
      okIcon: 'check',
      cancelIcon: 'close',
      okType: 'primary',
      okDanger: false
    });
  }

  showUserDeactivation(userInfo: any): Promise<boolean> {
    return this.showConfirmation({
      title: 'Deactivate User',
      titleIcon: 'stop',
      titleColor: '#ef4444',
      content: 'This user will no longer be able to access the system until reactivated.',
      userInfo: userInfo,
      infoSections: [
        {
          type: 'warning',
          icon: 'exclamation-circle',
          title: 'Access Restriction',
          description: 'The user will be immediately logged out and unable to sign in until their account is reactivated.'
        }
      ],
      okText: 'Yes, Deactivate',
      cancelText: 'Cancel',
      okIcon: 'stop',
      cancelIcon: 'close',
      okType: 'primary',
      okDanger: true
    });
  }

  showUserActivation(userInfo: any): Promise<boolean> {
    return this.showConfirmation({
      title: 'Activate User',
      titleIcon: 'check-circle',
      titleColor: '#10b981',
      content: 'This user will be able to access the system immediately.',
      userInfo: userInfo,
      infoSections: [
        {
          type: 'success',
          icon: 'check-circle',
          title: 'Access Granted',
          description: 'The user will be able to sign in and access all their assigned permissions.'
        }
      ],
      okText: 'Yes, Activate',
      cancelText: 'Cancel',
      okIcon: 'check',
      cancelIcon: 'close',
      okType: 'primary',
      okDanger: false
    });
  }

  showUserDeletion(userInfo: any): Promise<boolean> {
    return this.showConfirmation({
      title: 'Delete User',
      titleIcon: 'delete',
      titleColor: '#ef4444',
      content: 'This action cannot be undone. All user data will be permanently removed.',
      userInfo: userInfo,
      infoSections: [
        {
          type: 'error',
          icon: 'exclamation-circle',
          title: 'Permanent Action',
          description: 'This will permanently delete the user account and all associated data. This action cannot be reversed.'
        }
      ],
      okText: 'Yes, Delete Permanently',
      cancelText: 'Cancel',
      okIcon: 'delete',
      cancelIcon: 'close',
      okType: 'primary',
      okDanger: true
    });
  }
} 