import { Directive, OnInit, HostListener, OnDestroy, Output, EventEmitter, ElementRef } from '@angular/core';

@Directive({
    selector: '[ctrlS]'
})

export class SaveDetectorDirective {

    @Output() ctrlS: EventEmitter<boolean>=new EventEmitter();

    constructor() {
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            this.ctrlS.emit(true);
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
