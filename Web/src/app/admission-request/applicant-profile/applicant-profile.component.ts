import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SharingDataService } from '../services/sharing-data.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-applicant-profile',
  templateUrl: './applicant-profile.component.html',
  styleUrls: ['./applicant-profile.component.scss']
})
export class ApplicantProfileComponent implements OnInit {
  @ViewChild('tabTitle', { static: true }) tabTitleTpl!: TemplateRef<any>;
  isApplicantProfile: boolean = false;

  tabs = [
    { key: 'address', title: 'Address', icon: 'home' },
    { key: 'education', title: 'Education Background', icon: 'book' },
    { key: 'work', title: 'Work Experience', icon: 'project' },
    { key: 'emergency', title: 'Emergency Contact', icon: 'phone' },
    { key: 'program', title: 'Program Request', icon: 'form' }
  ];

  currentTab = 'address';
  selectedIndex = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private sharingData: SharingDataService,
     private router: Router,
  ) {
    this.sharingData.updateApplicantProfileStatus(true);
  }

  ngOnInit(): void {

  }
  onTabChange(index: number): void {
    this.selectedIndex = index;
    this.currentTab = this.tabs[index].key;
  }
  tabTitle(tab: any): SafeHtml {
    const html = `<i nz-icon nzType="${tab.icon}"></i> ${tab.title}`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
  editProfile() {
    this.sharingData.updateApplicantProfileStatus(false);  
    this.router.navigateByUrl(
      `/student-application/admission-request`
    );
  }

}
