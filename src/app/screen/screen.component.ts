import { Component, OnInit} from '@angular/core';
import * as $ from 'jquery';

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
  imagewidth;

  selectedImage: string;
  anotherTryVisible: boolean;
  public localUrl: any;
  public tiffUrl: any;
  url;
  isTiff = false;
  localUrlArray: any[]=[];
  multipleImages = true;
  multipleImage=true;
  loaded = false;
  imgFileCount = 0;
  imgWidth;


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
    var fileRead = event.target.files[0];
    if (event.target.files && fileRead) {

      console.log("event.target.files[0].type : "+fileRead.type);
      if(fileRead.type == 'image/tiff'){

            var reader = new FileReader();
            reader.onload = (event: any) => {
                this.localUrl = event.target.result;

                  var image = new Tiff({ buffer: this.localUrl });
                  console.log("tiff file url",this.localUrl);
                  console.log('width = ' + image.width() + ', height = ' + image.height());
                  var canvas = image.toCanvas();
                  this.isTiff = true;
                  console.log("this.isTiff: "+this.isTiff);
                  var img = convertCanvasToImage(canvas) ;

                  this.localUrl = img.src;
                 }
                 return reader.readAsArrayBuffer(fileRead);
            }

            else {
              var reader = new FileReader();
              reader.onload = (event: any) => {
                this.isTiff = false;
              this.localUrl = event.target.result;
              console.log(this.localUrl);
              }
             return reader.readAsDataURL(fileRead);
          }
        }
  }


  asVertical(){
    this.value='horizontal';
  }

  asHorizontal(){
    this.value='vertical';
  }

  zoomInFun(){
   var myImg;
    if(this.isTiff==true){
      console.log("istiff",this.isTiff)
      myImg= document.getElementById("tiffToRead");
    }else{
      console.log("istiff",this.isTiff)
      myImg= document.getElementById("imgToRead");
    }
    var currWidth = myImg.clientWidth;
    if (currWidth == 100) return false;
    else {
      myImg.style.width = (currWidth + 100) + "px";
    }
  }

  zoomOutFun(){
    var myImg;
    if(this.isTiff==true){
      console.log("istiff",this.isTiff)
      myImg= document.getElementById("tiffToRead");
    }
    else{
      console.log("istiff",this.isTiff)
      myImg= document.getElementById("imgToRead");
    }
    var currWidth = myImg.clientWidth;
    if (currWidth == 100) return false;
    else {
      myImg.style.width = (currWidth - 100) + "px";
    }
  }

  NextImage()
  {

    this.imgFileCount++;
    console.log("localUrlArray.length: "+this.localUrlArray.length+"imgCount: "+this.imgFileCount);
    this.localUrl = this.localUrlArray[this.imgFileCount];
    console.log("localUrl: "+this.localUrl);
    if(this.localUrlArray.length -1 == this.imgFileCount)
    {
      this.multipleImages = true;
    }
    if( this.imgFileCount>0)
    {
      this.multipleImage = false;
    }

  }

  previousImage()
  {
    this.imgFileCount--;
    console.log("localUrlArray.length: "+this.localUrlArray.length+"imgCount: "+this.imgFileCount);
    this.localUrl = this.localUrlArray[this.imgFileCount];
    console.log("localUrl: "+this.localUrl);
    console.log("localUrl: "+this.localUrl);
    if(this.localUrlArray.length-1 == this.imgFileCount)
    {
      this.multipleImages = false;
    }
    if( this.imgFileCount==0)
    {
      this.multipleImage = true;
    }
  }



  uploadFolder(event) {
    let output = document.getElementById("listing");
    let files = event.target.files;

    if(files.length > 0)
    {
      this.multipleImages = false;
    }



    for (let i=0; i<files.length; i++) {
      let item = document.createElement("li");
      item.innerHTML = files[i].webkitRelativePath;

      console.log("webkitRelativePath: "+ files[i].webkitRelativePath);
        var reader = new FileReader();
        reader.onload = (event: any) => {

            this.localUrlArray[i] = event.target.result;
            console.log(event.target.result);
            console.log("localUrlArray.length: "+this.localUrlArray.length+"imgCount: "+this.imgFileCount);
            this.localUrl = this.localUrlArray[this.imgFileCount];
            console.log("localUrl: "+this.localUrl);
            this.loaded = true;
        }
        reader.readAsDataURL(files[i]);

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

declare var lastDownX: number;




