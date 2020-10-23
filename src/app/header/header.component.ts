import { Component, EventEmitter, OnInit,Input } from '@angular/core';
import * as $ from 'jquery';
import {ScreenComponent} from '../screen/screen.component';
import {HeaderService} from '../services/header.service';
declare var Tiff: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {

  inputValue:String ;
  isTiff=false;


  constructor(private headerService : HeaderService) { }

  ngOnInit(): void {
  }selectedImage: string;
  anotherTryVisible: boolean;

  public localUrl: string;


  importFile(event) {
    this.anotherTryVisible = true;
    var fileRead = event.target.files[0];
    if (event.target.files && fileRead) {

      console.log("event.target.files[0].type : "+fileRead.type);
      if(fileRead.type == 'image/tiff'){

            var reader = new FileReader();
            reader.onload = (event: any) => {
                this.localUrl = event.target.result;

                  var image = new Tiff({ buffer: this.localUrl });
                  //console.log(this.localUrl);
                  console.log('width = ' + image.width() + ', height = ' + image.height());
                  var canvas = image.toCanvas();


                  this.isTiff = true;
                  console.log("this.isTiff: "+this.isTiff);
                  var img = convertCanvasToImage(canvas) ;

                  this.localUrl = img.src;
                  this.headerService.setUrl(this.localUrl);
                 }
                 return reader.readAsArrayBuffer(fileRead);
            }

            else {
              var reader = new FileReader();
              reader.onload = (event: any) => {
                this.isTiff = false;
              this.localUrl = event.target.result;
              this.headerService.setUrl(this.localUrl);
              console.log(this.localUrl);
              }
            return reader.readAsDataURL(fileRead);
          }

    }
  }
}


function convertCanvasToImage(canvas) {
  console.log("in convert................")
	var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log(image.src);
  // this.tiffUrl = image.src;

  //console.log("extension",image.);
	return image;
}






