import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-student-search',
  templateUrl: './student-search.component.html',
  styleUrls: ['./student-search.component.scss']
})
export class StudentSearchComponent {
  @Input() placeholder: string = 'Enter Student ID (e.g., 2021/001)';
  @Input() buttonText: string = 'Search';
  @Input() loadingText: string = 'Searching...';
  @Input() showInfo: boolean = true;
  @Input() title: string = 'Student Search';
  @Input() description: string = 'Enter the Student ID to search';

  @Output() searchSubmitted = new EventEmitter<string>();
  @Output() searchError = new EventEmitter<string>();

  searchForm: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      studentId: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    if (this.searchForm.valid) {
      this.loading = true;
      this.error = '';
      
      const studentId = this.searchForm.get('studentId')?.value;
      this.searchSubmitted.emit(studentId);
    }
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
  }

  setError(error: string): void {
    this.error = error;
    this.loading = false;
  }

  clearError(): void {
    this.error = '';
  }

  resetForm(): void {
    this.searchForm.reset();
    this.error = '';
    this.loading = false;
  }

  getErrorMessage(): string {
    const control = this.searchForm.get('studentId');
    if (control?.hasError('required')) {
      return 'Student ID is required';
    }
    if (control?.hasError('minlength')) {
      return 'Student ID must be at least 3 characters';
    }
    return '';
  }
} 