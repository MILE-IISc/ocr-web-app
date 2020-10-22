import { EventEmitter } from '@angular/core';

export class HeaderService{
    urlChanged = new EventEmitter<string>();
    url:string;

    setUrl(localUrl){
        this.url=localUrl;
        //console.log('setting',this.url);
        this.urlChanged.emit(this.url);
    }

    getUrl(){
        //console.log('getting',this.url);
        return this.url;
    }

}