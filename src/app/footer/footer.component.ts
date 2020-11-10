
import { Component, OnInit,Renderer2} from '@angular/core';
import * as $ from 'jquery';

declare var Tiff: any;

import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { ViewerService } from '../services/viewer.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
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
   nextImages = true;
   previousImages=true;
  loaded = false;
  imgFileCount = 0;
  imgWidth;
  isTiff=false;
  fit:string;
  public percentage:number;
  public angle:number=0.0;
  btnImgArray: any[] = [];
  display="none";
  images :Images[];
 divelement=true;

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

    this.imageService.nextImageChange.subscribe( (nextImages: boolean) => {
      console.log("nextImages inside footer: "+nextImages);
      this.nextImages = nextImages;
   });

   this.imageService.previousImageChange.subscribe( (previousImages: boolean) => {
    console.log("nextImages inside footer: "+previousImages);
    this.previousImages = previousImages;
 });




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
      this.value='horizontal';

      this.viewerService.asVertical();
      console.log("asVertical has been invoked from screen");
      this.percentage =  this.viewerService.percentage;


    }

    asHorizontal(){
      this.value='vertical';
      this.viewerService.asHorizontal();

      this.percentage =  this.viewerService.percentage;
    }

    fitheight(){
      this.viewerService.fitheight();
      this.percentage=this.viewerService.percentage;
    }

    fitwidth(){
      // this.viewerService.fitwidth();
    this.viewerService.fitwidth()
    this.percentage=this.viewerService.percentage;

    }

    zoomInFun(){

     this.viewerService.zoomInFun();
     this.percentage=this.viewerService.percentage;
      }

    zoomOutFun(){

             this.viewerService.zoomOutFun();
             this.percentage=this.viewerService.percentage;
       }
  rotateImage()
  {
   this.viewerService.rotateImage();
  this.angle=this.viewerService.angle;
  }
  rotateImageanti()
  {
    this.viewerService.rotateImageanti();
     this.angle=this.viewerService.angle;
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
 openModalDialog(){
  this.images = this.imageService.getImages();
  this.imageService.openModalDialog(this.images,this.display);
}

NextImage(){
    this.imageService.nextPage();
    // console.log("inside footer nextImage: "+this.imageService.nextImages);
    // this.nextImages = this.imageService.nextImages;
    // console.log("next Images"+this.nextImages);
  }

  previousImage(){
    this.imageService.previousPage();
    // console.log("inside footer previousImage: "+this.imageService.previousImages);
    // this.previousImages = this.imageService.previousImages;
    // console.log("previous Images"+this.previousImages);
 }

 lastImage(){
   this.imageService.LastImage();
 }
 firstImage(){
   this.imageService.firstImage();
 }
 skipPage(){
  //this.localUrl = this.localUrlArray[this.imgFileCount];
}


}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image.src: "+image.src);
  return image;
}

