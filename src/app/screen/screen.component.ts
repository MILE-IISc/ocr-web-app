import { Component, OnInit,Renderer2} from '@angular/core';
import * as $ from 'jquery';

declare var Tiff: any;

import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';


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
  percentage:number;
  angle=0;
  btnImgArray: any[] = [];
  display;
  images :Images[];


  constructor(private headerService: HeaderService,private imageService:ImageService,
    private renderer: Renderer2) { }

  ngOnInit(): void {

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
      setTimeout(() => this.fitwidth(),50);
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
    if(filesCount > 0)
      {
        this.nextImage = false;
      }
    if (event.target.files && fileRead) {
      this.imageService.addImage(fileRead);
    }
    setTimeout(() => this.fitwidth(),50);
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
    var myImg;

    var degree = this.angle;
     myImg= document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    ) }


    onZoom(value:number){
      this.percentage=value;
     var myImg;

     var zoomlevel= this.percentage
     console.log("istiff",this.isTiff)
     myImg= document.getElementById("imgToRead");
     var realWidth = myImg.naturalWidth;
   var realHeight = myImg.naturalHeight;


   var currWidth = myImg.clientWidth;
   var currHeight = myImg.clientHeight;

     myImg.style.width = (realWidth * zoomlevel/100) + "px";
     console.log("currwidth"+currWidth)
     myImg.style.height = (realHeight * zoomlevel/100) + "px";
     console.log("currheight"+currHeight)

    }

    asVertical(){
      this.value='horizontal';
      if(this.fit =='width'){
     setTimeout(() => this.fitwidth(),50);}
     else if(this.fit=='height'){
     setTimeout(() => this.fitheight(),50);}
     else if (this.fit=='orginalsize'){
     setTimeout(() => this.orginalsize(),50);}
    }

    asHorizontal(){
      this.value='vertical';
      if(this.fit =='width'){
        setTimeout(() => this.fitwidth(),50);}
        else if(this.fit=='height'){
        setTimeout(() => this.fitheight(),50);}
        else if (this.fit=='orginalsize'){
        setTimeout(() => this.orginalsize(),50);}
    }

    fitheight(){
      this.fit= 'height';
      var myImg;
    myImg= document.getElementById("imgToRead");


      myImg.style.height = 100+"%";
      var currHeight = myImg.clientHeight;
      var realHeight = myImg.naturalHeight;
      var realWidth = myImg.naturalWidth;
      this.percentage=currHeight/realHeight*100;
      myImg.style.width = (realWidth * this.percentage/100) + "px";
    }

    fitwidth(){
      this.fit= 'width';
      var myImg;
    myImg= document.getElementById("imgToRead");


      myImg.style.width = 100+"%";
      var currWidth = myImg.clientWidth;
       var realHeight = myImg.naturalHeight;
      var realWidth = myImg.naturalWidth;
      this.percentage=(currWidth/realWidth)*100;
      myImg.style.height = (realHeight* this.percentage/100) + "px";
    }

    zoomInFun(){

     var myImg;
     this.percentage = this.percentage + 7.2;

        console.log("istiff",this.isTiff)
        myImg= document.getElementById("imgToRead");
        var realWidth = myImg.naturalWidth;
      var realHeight = myImg.naturalHeight;


      var currWidth = myImg.clientWidth;
      var currHeight = myImg.clientHeight;

        myImg.style.width = (realWidth * this.percentage/100) + "px";
        console.log("currwidth"+currWidth)
        myImg.style.height = (realHeight * this.percentage/100) + "px";
        console.log("currheight"+currHeight)
      }

    zoomOutFun(){

      var myImg;
      this.percentage = this.percentage -7.2;

         console.log("istiff",this.isTiff)
         myImg= document.getElementById("imgToRead");
         var realWidth = myImg.naturalWidth;
       var realHeight = myImg.naturalHeight;


       var currWidth = myImg.clientWidth;
       var currHeight = myImg.clientHeight;

         myImg.style.width = (realWidth * this.percentage/100) + "px";
         console.log("currwidth"+currWidth)
         myImg.style.height = (realHeight * this.percentage/100) + "px";
         console.log("currheight"+currHeight)
       }
       rotateImage()
  {
    this.angle++;
  var myImg;

    var degree = this.angle;
     myImg= document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }
  rotateImageanti()
  {
    this.angle--;
  var myImg;

    var degree = this.angle;
     myImg= document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }
 imgSize(){
  var myImg;
    myImg= document.getElementById("imgToRead");

    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    alert("Original width=" + realWidth + ", " + "Original height=" + realHeight);
 }
 orginalsize(){
   this.fit='orginalsize';
  var myImg;
  myImg= document.getElementById("imgToRead");
  myImg.style.width = myImg.naturalWidth+"px";
      console.log("currwidth"+myImg.naturalWidth)
      myImg.style.height = myImg.naturalHeight+ "px";
      console.log("currheight"+myImg.naturalHeight)
      this.percentage=100;

 }


}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image.src: "+image.src);
  return image;
}
