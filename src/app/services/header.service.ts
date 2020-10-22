import { EventEmitter } from '@angular/core';

export class HeaderService{
    urlChanged = new EventEmitter<string>();
    url:string;

    setUrl(headerUrl){
        this.url=headerUrl;
        //console.log('setting',this.url);
        this.urlChanged.emit(this.url);
    }

    getUrl(){
        //console.log('getting',this.url);
        return this.url;
    }

}