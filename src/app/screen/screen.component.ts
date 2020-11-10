import { Component, OnInit,Renderer2} from '@angular/core';
import * as $ from 'jquery';

declare var Tiff: any;

import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { ViewerService } from '../services/viewer.service';


@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css'],
})
export class ScreenComponent implements OnInit{
  title = 'Layout';
  public value:string;
  imagewidth;

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


  constructor(private headerService: HeaderService,private imageService:ImageService,private viewerService:ViewerService,
    private renderer: Renderer2) { }

  ngOnInit(): void {
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


      this.images = this.imageService.getImages();
      this.imageService.imagesModified.subscribe( (images:Images[]) => {
      console.log("inside service subscribe....");
      console.log("inside foooor");
      this.localUrl = images[0].imagePath;
      this.fileName=images[0].fileName;
      setTimeout(() => this.viewerService.fitwidth(),50);
      setTimeout(() => this.setpercentage(),60);
     });

     this.imageService.displayChange.subscribe((display:any)=>{
      this.display=display;
     });

     this.localUrl =this.imageService.getUrl();
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

    if (event.target.files && fileRead) {
      this.imageService.addImage(fileRead);
    }
    setTimeout(() => this. fitwidth(),50);
    setTimeout(() => this.setpercentage(),60);

    var element = document.getElementById("content");
    console.log("documents----"+element)
    this.imageService.setDocumentId(element);
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


}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image.src: "+image.src);
  return image;
}
