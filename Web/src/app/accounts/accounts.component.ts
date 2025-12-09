import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit {

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Monitor route changes within accounts module
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      console.log('AccountsComponent: Route changed to:', event.url);
      
      // Force change detection and refresh
      setTimeout(() => {
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      }, 0);
      
      // Additional refresh mechanism for stubborn cases
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    });
  }
}
