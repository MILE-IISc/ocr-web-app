import { Component, OnInit,Renderer2} from '@angular/core';
declare var $:any;


import * as $ from 'jquery';

// import * as $ from 'jquery';
declare var $:any

declare var Tiff: any;

import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { ViewerService } from '../services/viewer.service';
import xml2js from 'xml2js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { XmlModel } from '../shared/xml-model';

@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css'],
})
export class ScreenComponent implements OnInit{

  isLoading = false;
  title = 'Layout';
  public value:string;
  imagewidth;
  xmlItems;
  words:any= XmlModel.textArray;
  selectedImage: string;
  anotherTryVisible: boolean;
  public localUrl: any;
  public tiffUrl: any;
  url;
  fileName : any;
  localUrlArray: any[]=[];
  files: any[] = []
 nextImage = true;
   previousImages=true;
  loaded = false;
  imgFileCount = 0;
  imgWidth;
  isTiff=false;
  fit:string;
  public percentage=0;
  public angle=0;
  btnImgArray: any[] = [];
  display;
  images :Images[];
  ImageIs=true;


  constructor(private headerService: HeaderService,private imageService:ImageService,private viewerService:ViewerService,
    private renderer: Renderer2) { }

  ngOnInit(): void {
    this.percentage= this.headerService.getpercentagevary();
    this.headerService.percentageChange
    .subscribe(
      (percent:number)=>{
        this.percentage=percent;
      }
    );

    this.isLoading = this.headerService.getloadingvalue();
    this.headerService.loadingvaluechage
    .subscribe(
      (spin:boolean)=>{
        this.isLoading=spin;
      }
    );

    this.value= this.headerService.getHeaderValue();
    this.headerService.headerValueChange
    .subscribe(
      (val:string)=>{
        this.value=val;
      }
      );

     this.nextImage = this.headerService.getMultipleImage();
     this.headerService.multiImageChange
     .subscribe(
       (multiImage:boolean)=>{
         this.nextImage=multiImage;
       }
     );


      // this.images = this.imageService.getImages();
      this.imageService.imagesModified.subscribe( (images:Images[]) => {
      console.log("inside service subscribe....");
      console.log("inside foooor");
      this.isLoading = true;
      if(images.length > 0){
      this.localUrl = images[0].imagePath;
      this.fileName=images[0].fileName;
      this.isLoading =false;

      this.ImageIs = true;
      setTimeout(() => this.viewerService.fitwidth(),50);
      setTimeout(() => this.setpercentage(),60);
    }
    else {

      this.ImageIs = false;
    }
     });

     this.imageService.displayChange.subscribe((display:any)=>{
      this.display=display;
     });

    //  this.localUrl =this.imageService.getUrl();
     this.imageService.urlChanged
     .subscribe(
       (url: any) => {
         console.log("Inside subscribe");
         console.log("url: "+url);
         this.localUrl = url;
       }
     );

     this.imageService.fileNameChange.subscribe( (fileName: any) => {
      console.log("nextImages inside footer: "+fileName);
      this.fileName = fileName;
   });

   var element = document.getElementById("content");
    console.log("documents----"+element)
    this.imageService.setDocumentId(element);

  }
  openModalDialog(){
    this.images = this.imageService.getImages();
    console.log("images count inside subscribe: "+this.images.length);
    this.btnImgArray.splice(0,this.btnImgArray.length);
    for(let i=0; i < this.images.length; i++) {
      // var btnImgId = "btnImgId" +this.images[i].id;
      var btnImgEle = "<button  style=\"width: 100%; border: none;\" (click)=\"openThisImage()\" class=\"btnImg\" value=\""+this.images[i].fileName+"\"  id=\""+this.images[i].id+"\">"+this.images[i].fileName+"</button>";
      console.log("btnImgEle: "+btnImgEle);
      this.btnImgArray.push(btnImgEle);
    }
    console.log("images count inside btnImgArray: "+this.btnImgArray.length);
    $(".modal-body").empty();
    for(let i=0; i < this.btnImgArray.length; i++) {
        $(".modal-body").append(this.btnImgArray[i]);
    }
  console.log("opening........")
  this.display='block'; //Set block css
 }

 openThisImage(event) {
  console.log("inside open this image");
   var id = event.target.value;
   console.log("id : "+id);
    this.images = this.imageService.getImages();
    for(let i=0; i < this.images.length; i++) {
      if(this.images[i].fileName == id) {
        this.localUrl = this.images[i].imagePath;
        this.fileName= this.images[i].fileName;
        this.imgFileCount = i;
      }
  }
  this.closeModalDialog();
 }

 closeModalDialog(){
  this.display='none'; //set none css after close dialog
 }


  importFile(event) {
    this.anotherTryVisible = true;
    var fileRead = event.target.files;
    var filesCount = event.target.files.length;
    console.log("isLoading before calling importFile: "+this.isLoading);
    this.isLoading =true;
    console.log("isLoading after calling importFile: "+this.isLoading);
    if (event.target.files && fileRead) {
      this.imageService.addImage(fileRead);
    }
    setTimeout(() => this. fitwidth(),50);
    setTimeout(() => this.setpercentage(),60);


  }




  NextImage()
  {
    this.images = this.imageService.getImages();
    this.imgFileCount++;
    console.log("next image length"+this.images.length);
    this.localUrl = this.images[this.imgFileCount].imagePath;
    this.fileName = this.images[this.imgFileCount].fileName;
    console.log("inside Next this.imgFileCount after incrementing: "+this.imgFileCount);
    if(this.images.length -1 == this.imgFileCount)
    {
      this.nextImage = true;
    }
    if( this.imgFileCount>0)
    {
      this.previousImages = false;
    }

  }


  previousImage()
  {
    this.images = this.imageService.getImages();
    this.imgFileCount--;
    this.localUrl = this.images[this.imgFileCount].imagePath;
    this.fileName = this.images[this.imgFileCount].fileName;
    console.log("inside Next this.imgFileCount after decrementing: "+this.imgFileCount);
    if(this.images.length-1 >this.imgFileCount)
    {
      this.nextImage = false;
    }
    if( this.imgFileCount==0)
    {
      this.previousImages = true;
    }
  }

  lastImage()
  {
    this.images = this.imageService.getImages();
    this.imgFileCount=this.images.length-1;

   // console.log("localUrlArray.length: "+this.localUrlArray.length+"imgCount: "+this.imgFileCount);
    this.localUrl = this.images[this.imgFileCount].imagePath;
    this.fileName = this.images[this.imgFileCount].fileName;
    //console.log("localUrl: "+this.localUrl);

    if(this.images.length-1 == this.imgFileCount)
    {
      this.nextImage = true;
      this.previousImages = false;
    }

  }
  firstImage()
  {
    this.images = this.imageService.getImages();
    this.imgFileCount=0;
    //console.log("localUrlArray.length: "+this.localUrlArray.length+"imgCount: "+this.imgFileCount);
    this.localUrl = this.images[this.imgFileCount].imagePath;
    this.fileName = this.images[this.imgFileCount].fileName;
    if(this.imgFileCount==0)
    {
      this.previousImages=true;
      this.nextImage=false;
    }
  }

  skipPage(){
    //this.localUrl = this.localUrlArray[this.imgFileCount];
  }


   onEnter(value: number) {
    this.angle = value;
    this.viewerService.angle = this.angle;
    this.viewerService.onEnter();

  }


    onZoom(value:number){

      this.percentage=value;
      this.viewerService.percentage= this.percentage;
      this.viewerService.onZoom();



    }

    asVertical(){
      this.viewerService.asVertical();
      this.value=this.viewerService.value;

      // this.viewerService.asVertical();
      console.log("asVertical has been invoked from screen");
      setTimeout(() => this.setpercentage(),50);


    }

    asHorizontal(){
      this.viewerService.asHorizontal();
      this.value=this.viewerService.value;
      // this.viewerService.asHorizontal();
      this.headerService.setpercentagevary(this.percentage);


      setTimeout(() => this.setpercentage(),50);


    }

    setpercentage(){
      this.percentage=  this.viewerService.getpercentage();

      this.headerService.setpercentagevary(this.percentage);

    }

    fitheight(){
      this.viewerService.fitheight();
      this.percentage=this.viewerService.percentage;

    }

    fitwidth(){
      this.viewerService.fitwidth();
    this.percentage=this.viewerService.percentage;

    }

    zoomInFun(){

     this.viewerService.zoomInFun();
      }

    zoomOutFun(){

             this.viewerService.zoomOutFun();
       }
  rotateImage()
  {
   this.viewerService.rotateImage();
  }
  rotateImageanti()
  {
    this.viewerService.rotateImageanti();
  }
 imgSize(){
  var myImg;
    myImg= document.getElementById("imgToRead");

    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    alert("Original width=" + realWidth + ", " + "Original height=" + realHeight);
 }
 orginalsize(){

  this.viewerService.orginalsize();
  this.percentage=this.viewerService.percentage;

 }
 updateScroll(scrollOne: HTMLElement, scrollTwo: HTMLElement){
  // do logic and set
  scrollTwo.scrollLeft = scrollOne.scrollLeft;
  scrollTwo.scrollTop = scrollOne.scrollTop;

}
updatescroll(scrollOne: HTMLElement, scrollTwo: HTMLElement){
  scrollOne.scrollLeft = scrollTwo.scrollLeft;
  scrollOne.scrollTop = scrollTwo.scrollTop;

}

selectBlock(){
  console.log("inside script");
    // $(document).ready( () => {
      $('img#imgToRead').selectAreas({
        minSize: [10, 10],
        onChanged : debugQtyAreas,
        // width: 500,
      });
    // });

    function debugQtyAreas (event, id, areas) {
      console.log(areas.length + " areas", arguments);
    };
  }



}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image.src: "+image.src);
  return image;
}
