import { EventEmitter } from '@angular/core';

export class HeaderService{

    multileImages:boolean;
    multiImageChange = new EventEmitter<boolean>();

    setMultipleImages(setimage){
        this.multileImages = setimage;
    }

    getMultipleImage(){
        return this.multileImages;
    }
}
