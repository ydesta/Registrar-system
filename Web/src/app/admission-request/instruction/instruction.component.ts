import { Component } from '@angular/core';
import { Instruction } from '../model/instruction.interface';

@Component({
  selector: 'app-instruction',
  templateUrl: './instruction.component.html',
  styleUrls: ['./instruction.component.scss']
})
export class InstructionComponent {
  instructions: Instruction[] = [
    {
      icon: 'file-text',
      title: 'Document Requirements',
      description: 'The application form should be returned along with one attested copy (non-returnable) of each testimonial (transcript and degree) with the original (returnable).'
    },
    {
      icon: 'notification',
      title: 'Application Status',
      description: 'Applicants will be notified of their admission request status by the office after the required processing of their application.'
    },
    {
      icon: 'edit',
      title: 'Letter of Motivation',
      description: 'A letter of motivation is required as part of your application package.'
    },
    {
      icon: 'info-circle',
      title: 'Acceptance Policy',
      description: 'Applying for admission doesn\'t guarantee acceptance. All applications are subject to review and approval.'
    },
    {
      icon: 'graduation-cap',
      title: 'Grade 12 Natural Science Requirement',
      description: 'If you are a Grade 12 completed student, only Natural Science students are allowed to apply.'
    }
  ];
}
