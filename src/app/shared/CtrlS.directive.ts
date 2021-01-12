import { Directive, OnInit, HostListener, OnDestroy, Output, EventEmitter, ElementRef } from '@angular/core';

@Directive({
    selector: '[ctrls]'
})

export class CtrlsDetectorDirective {

    @Output() ctrls: EventEmitter<boolean>=new EventEmitter();
    constructor() {
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            this.ctrls.emit(true);
            event.preventDefault();
        }
    }

    // @HostListener('window:keydown', ['$event'])
    // onKeyDown(event: KeyboardEvent) {
    //   if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    //     console.log("after key pressed");
    //     this.correctionUpdate();
    //     event.preventDefault();
    //   }
    // }
}
