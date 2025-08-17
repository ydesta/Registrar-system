import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-floating-label-input',
  template: `
    <div class="floating-label-container">
      <input
        [type]="type"
        [id]="id"
        [placeholder]="placeholder"
        [value]="value"
        [disabled]="disabled"
        [class.error]="hasError"
        [class.success]="hasSuccess"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        class="floating-input"
      />
      <label [for]="id" class="floating-label">
        <i *ngIf="icon" [class]="icon"></i>
        {{ label }}
        <span *ngIf="required" class="required">*</span>
      </label>
    </div>
  `,
  styleUrls: ['./floating-label-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FloatingLabelInputComponent),
      multi: true
    }
  ]
})
export class FloatingLabelInputComponent implements ControlValueAccessor {
  @Input() type: string = 'text';
  @Input() id: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = ' ';
  @Input() icon?: string;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() hasError: boolean = false;
  @Input() hasSuccess: boolean = false;

  value: string = '';
  focused: boolean = false;

  // ControlValueAccessor implementation
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onFocus(): void {
    this.focused = true;
    this.onTouched();
  }

  onBlur(): void {
    this.focused = false;
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
