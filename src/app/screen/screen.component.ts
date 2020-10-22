import { Component, OnInit} from '@angular/core';
import * as $ from 'jquery';
// import * as Tiff from 'tiff.js';
// import * as fs from 'file-system';

declare var Tiff: any; 

import { HeaderService } from '../services/header.service';


@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css'],
})
export class ScreenComponent implements OnInit{
  title = 'Layout';
  value = 'horizontal';

  selectedImage: string;
  anotherTryVisible: boolean;
  public localUrl: any;
  //public headUrl ;
  url;
  isTiff :boolean =false;

  

  constructor(private headerService: HeaderService) { }

  ngOnInit(): void {

    this.localUrl =this.headerService.getUrl();
    this.headerService.urlChanged
    .subscribe(
      (url: any) => {
        console.log("Inside subscribe");
        console.log("url: "+url);
        this.localUrl = url;
      }
    );
  }
    
  importFile(event) {
    this.anotherTryVisible = true;

    if (event.target.files && event.target.files[0]) {

      console.log("event.target.files[0].type : "+event.target.files[0].type);
            var reader = new FileReader();
            reader.onload = (event: any) => {
                this.localUrl = event.target.result;
              
                  var image = new Tiff({ buffer: this.localUrl });
                  console.log('width = ' + image.width() + ', height = ' + image.height());
                  var canvas = image.toCanvas();
                  $("#imgToRead").append(canvas);
               
            } 
            return reader.readAsArrayBuffer(event.target.files[0]);
            
    }


    // for(var i = 0; i < files.length; i++) {
    //   fileReader = new FileReader();
    //   fileReader.onload = handler;
    //   fileReader.readAsArrayBuffer(files[i]);            // convert selected file
    // }
    
    // function handler() {                                 // file is now ArrayBuffer:
    //   var tiff = new Tiff({buffer: this.result});        // parse and convert
    //   var canvas = tiff.toCanvas();                      // convert to canvas
    //   document.querySelector("div").appendChild(canvas); // show canvas with content
    // };

    
  }


asVertical(){
  this.value='horizontal';
}

asHorizontal(){
  this.value='vertical';
}

drag(){
  var isResizing = false;
  $(function () {
    var container = $('#wrapper'),
        left = $('#imageForOCR'),
        right = $('#textFromOCR'),
        handle = $('#grabber');

    handle.on('mousedown', function (e) {
        isResizing = true;
        lastDownX = e.clientX;
    });

    $(document).on('mousemove', function (e) {
        // we don't want to do anything if we aren't resizing.
        if (!isResizing)
            return;

        var offsetRight = container.width() - (e.clientX - container.offset().left);
        left.css('right', offsetRight);
        right.css('width', offsetRight);

    }).on('mouseup', function (e) {
        // stop resizing
        isResizing = false;
    });
    //$( "#imageForOCR" ).resizable({ ghost: true });
})

}
  zoomInFun(){
    var myImg = document.getElementById("imgToRead");
  var currWidth = myImg.clientWidth;
  if (currWidth == 100) return false;
  else {
    myImg.style.width = (currWidth + 100) + "px";
  }
  }

  zoomOutFun(){
    var myImg = document.getElementById("imgToRead");
  var currWidth = myImg.clientWidth;
  if (currWidth == 100) return false;
  else {
    myImg.style.width = (currWidth - 100) + "px";
  }
  }
}

declare var lastDownX: number;



