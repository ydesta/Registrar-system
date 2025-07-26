import { Directive, ElementRef, Input, Renderer2 } from "@angular/core";

@Directive({
  selector: "[appDisabledTab]"
})
export class DisabledTabDirective {
  @Input() disableTab = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (this.disableTab) {
      this.renderer.setAttribute(this.el.nativeElement, "disabled", "true");
    } else {
      this.renderer.removeAttribute(this.el.nativeElement, "disabled");
    }
  }
}
