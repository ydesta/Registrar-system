import { Component } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  formData: ContactForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  constructor(private message: NzMessageService) {}

  onSubmit(): void {
    this.message.success('Thank you for your message. We will get back to you soon!');
    this.formData = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
  }
} 