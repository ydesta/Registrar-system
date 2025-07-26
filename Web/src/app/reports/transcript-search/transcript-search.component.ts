import { Component, ViewChild } from '@angular/core';
import { StudentService } from '../../students/services/student.service';
import { StudentSearchComponent } from '../../shared-module/shared/components/student-search/student-search.component';
import { PdfExportService } from '../services/pdf-export.service';
import { StudentTranscriptViewModel } from '../model/student-transcript-view-model.model';

@Component({
  selector: 'app-transcript-search',
  templateUrl: './transcript-search.component.html',
  styleUrls: ['./transcript-search.component.scss']
})
export class TranscriptSearchComponent {
  @ViewChild(StudentSearchComponent) studentSearchComponent!: StudentSearchComponent;
  
  transcript: StudentTranscriptViewModel | null = null;
  showSearchForm = true;
  isExporting = false;

  constructor(
    private studentService: StudentService,
    private _pdfExportService: PdfExportService
  ) {}

  onSearchSubmitted(studentId: string): void {
    this.studentService.getStudentTranscriptByStudentId(studentId).subscribe({
      next: (data) => {
        this.transcript = data;
        this.showSearchForm = false; 
        this.studentSearchComponent.setLoading(false);
      },
      error: (error) => {
        this.studentSearchComponent.setError('Failed to load transcript. Please check the Student ID.');
        console.error('Transcript loading error:', error);
      }
    });
  }

  showSearch(): void {
    this.showSearchForm = true;
    this.transcript = null;
    this.studentSearchComponent.resetForm();
  }

  formatDecimal(value: number): string {
    return value.toFixed(2);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  exportTranscript(): void {
    if (!this.transcript) {
      return;
    }
    this.isExporting = true;
    const studentName = this.transcript.fullName.replace(/\s+/g, '_');
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Transcript_${studentName}_${currentDate}.pdf`;
    this._pdfExportService.exportTranscript(this.transcript, filename);
    this.isExporting = false;
  }
} 