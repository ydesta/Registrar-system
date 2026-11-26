import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { StudentProfileViewModel } from '../../models/student-profile-view-model.model';
import { StudentService } from '../../services/student.service';
import { environment } from 'src/environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
})
export class ProfileSummaryComponent implements OnInit, OnDestroy {
  studentProfile: StudentProfileViewModel | null = null;
  profilePicture: string = '';
  /** Bumps so Angular recreates the <img> when the photo changes. */
  photoVersion = 0;
  userId: string | null = null;
  initials: string = '';
  isLoading: boolean = false;
  isUploadingPhoto: boolean = false;
  error: string | null = null;

  private readonly maxPhotoBytes = 5 * 1024 * 1024;
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  private localPreviewUrl: string | null = null;

  constructor(
    private studentService: StudentService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.userId = localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.getStudentProfile();
  }

  ngOnDestroy(): void {
    this.revokeLocalPreview();
  }

  getStudentProfile(options?: { silent?: boolean }): void {
    if (!this.userId) {
      this.error = 'User ID not found. Please log in again.';
      return;
    }

    const silent = !!options?.silent;
    if (!silent) {
      this.isLoading = true;
    }
    this.error = null;

    this.studentService
      .getStudentProfileByApplicationId(this.userId)
      .pipe(
        catchError((err) => {
          if (!silent) {
            this.error = 'Failed to load profile. Please try again later.';
          }
          console.error('Error loading profile:', err);
          return of(null);
        }),
        finalize(() => {
          if (!silent) {
            this.isLoading = false;
          }
          this.cdr.detectChanges();
        })
      )
      .subscribe((res) => {
        if (res) {
          this.applyProfile(res);
          this.cdr.detectChanges();
        }
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.allowedTypes.includes(file.type)) {
      this.message.error('Please choose a JPG or PNG image.');
      input.value = '';
      return;
    }

    if (file.size > this.maxPhotoBytes) {
      this.message.error('Image must be 5MB or smaller.');
      input.value = '';
      return;
    }

    // Show the new image immediately while upload runs.
    this.showLocalPreview(file);

    this.isUploadingPhoto = true;
    this.studentService
      .updateProfilePhoto(file)
      .pipe(
        catchError((err) => {
          const apiError =
            err?.error?.error ||
            err?.error?.Error ||
            err?.error?.message ||
            'Failed to update profile photo.';
          this.message.error(apiError);
          console.error('Error updating profile photo:', err);
          // Keep local preview if upload failed? Prefer reload last server photo.
          this.getStudentProfile({ silent: true });
          return of(null);
        }),
        finalize(() => {
          this.isUploadingPhoto = false;
          input.value = '';
          this.cdr.detectChanges();
        })
      )
      .subscribe((res) => {
        if (!res) {
          return;
        }

        const photoUrl = this.extractPhotoUrl(res);
        if (photoUrl) {
          this.setProfilePicture(photoUrl);
          if (this.studentProfile) {
            this.studentProfile.photoUrl = this.stripResourcePrefix(photoUrl);
          }
          this.message.success('Profile photo updated.');
          this.cdr.detectChanges();
        } else {
          this.message.success('Profile photo updated.');
          // Soft refresh — do not flash the full-page loader.
          this.getStudentProfile({ silent: true });
        }
      });
  }

  isValidProfilePicture(url: string | null): boolean {
    return !!url && !url.includes('/null');
  }

  getProfilePictureUrl(photoUrl: string | null | undefined): string {
    if (!photoUrl) {
      return this.getDefaultImage();
    }
    return `${environment.fileUrl}/Resources/profile/${photoUrl}`;
  }

  getDefaultImage(): string {
    return 'assets/images/profile.png';
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const fatherName = nameParts[1] || '';
    return firstName.charAt(0).toUpperCase() + fatherName.charAt(0).toUpperCase();
  }

  private applyProfile(res: StudentProfileViewModel): void {
    this.studentProfile = res;
    this.initials = this.getInitials(this.studentProfile.fullName || '');
    if (res.photoUrl) {
      this.setProfilePicture(res.photoUrl);
    } else if (!this.localPreviewUrl) {
      this.profilePicture = '';
      this.photoVersion++;
    }
  }

  private setProfilePicture(photoUrlOrPath: string): void {
    this.revokeLocalPreview();
    const fileName = this.stripResourcePrefix(photoUrlOrPath);
    this.profilePicture =
      environment.fileUrl +
      '/Resources/profile/' +
      fileName +
      '?t=' +
      Date.now();
    this.photoVersion++;
  }

  private showLocalPreview(file: File): void {
    this.revokeLocalPreview();
    this.localPreviewUrl = URL.createObjectURL(file);
    this.profilePicture = this.localPreviewUrl;
    this.photoVersion++;
    this.cdr.detectChanges();
  }

  private revokeLocalPreview(): void {
    if (this.localPreviewUrl) {
      URL.revokeObjectURL(this.localPreviewUrl);
      this.localPreviewUrl = null;
    }
  }

  private extractPhotoUrl(res: any): string | null {
    const candidates = [
      res?.data?.photoUrl,
      res?.Data?.photoUrl,
      res?.data?.PhotoUrl,
      res?.Data?.PhotoUrl,
      res?.photoUrl,
      res?.PhotoUrl,
    ];
    for (const value of candidates) {
      if (typeof value === 'string' && value.trim() && value !== 'null') {
        return value.trim();
      }
    }
    return null;
  }

  private stripResourcePrefix(path: string): string {
    return path
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/?Resources\/profile\//i, '')
      .replace(/^profile\//i, '')
      .split('?')[0]
      .replace(/^\//, '');
  }
}
