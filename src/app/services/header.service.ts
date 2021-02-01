import { EventEmitter } from '@angular/core';

export class HeaderService {

  multileImages: boolean;
  multiImageChange = new EventEmitter<boolean>();


  setMultipleImages(setimage) {
    this.multileImages = setimage;
  }

  getMultipleImage() {
    return this.multileImages;
  }

  percentage: number;
  percentageChange = new EventEmitter<number>();

  setpercentagevary(imagezoomlevel) {
    this.percentage = imagezoomlevel;
    this.percentageChange.emit(this.percentage);
  }

  getpercentagevary() {
    return this.percentage;
  }

  headerValueChange = new EventEmitter<string>();
  headerValue: string;

  setHeaderValue(setimage) {
    this.headerValue = setimage;
    this.headerValueChange.emit(this.headerValue);
  }

  getHeaderValue() {
    return this.headerValue;
  }

  loadingvaluechage = new EventEmitter<boolean>();
  loadingvalue: boolean;

  setloadingvalue(load) {
    this.loadingvalue = load;
    this.loadingvaluechage.emit(this.loadingvalue)
  }
  getloadingvalue() {
    return this.loadingvalue;
  }


 messageemit = new EventEmitter<string>();
  loadmessage:string;

  setloadmessage(message) {
    this.loadmessage = message;
    this.messageemit.emit(this.loadmessage);
    }

  getloadmessage() {
    return this.loadmessage;
  }
}
