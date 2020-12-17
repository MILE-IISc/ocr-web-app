import { EventEmitter, Injectable, OnInit } from '@angular/core';
import * as $ from 'jquery';

import { Images } from '../shared/images.model';

declare var Tiff: any;

@Injectable()
export class ImageService implements OnInit{
  displayImages;

  ngOnInit(): void {
    this.imageLoaded
    .subscribe(
      (images: Images) => {
        console.log("imageLoaded:+++++++++++++++++++++++++++++ ");
      }
    );
  }


  fit:string;
  fileName;
  public nextImages = false;
  public previousImages=false;
  btnImgArrayChange = new EventEmitter<any>();
  imageLoaded = new EventEmitter<Images>();
  imagesModified = new EventEmitter<Images[]>();
  nextImageChange = new EventEmitter<boolean>();
  displayChange = new EventEmitter<any>();
  nextValueChange = new EventEmitter<any>();
  previousImageChange = new EventEmitter<boolean>();
  documentChange = new EventEmitter<any>();
  fileNameChange = new EventEmitter<any>();
  images: Array<Images> = [];
  imgFileCount = 0;
  ready = false;
  percentage:number;
  btnImgArray: any[] = [];
  public localUrl: string;
  public documentElement;
  //display='none';

  getImages() {
    return this.images.slice();
  }

  getBtnImages(){
    return this.btnImgArray.slice();
  }

  setDocumentId(element){
    this.documentElement=element;
    this.documentChange.emit(this.documentElement);
  }

  getDocumentId() {
    return this.documentElement.slice();
  }

  urlChanged = new EventEmitter<string>();
  url:string;

  setUrl(localUrl){
      this.url=localUrl;
      this.urlChanged.emit(this.url);
  }

  getUrl(){

      return this.url;
  }

  async addImage(fileRead){
    this.images.splice(0,this.images.length);
    var filesCount = fileRead.length;
    if(filesCount > 1)
      {
        this.nextImages = false;
      }
    console.log("file count"+filesCount);
    for (let i=0; i<filesCount; i++){
      var isImage = fileRead[i].type.includes("image");


      if (isImage){
      console.log("fileRead.type : "+fileRead[i].type);
      console.log("fileRead["+i+"].name : "+fileRead[i].name);
      console.log("Inside service when pdf is selected length"+this.images.length)
      let dataURL = await this.loadArray(fileRead,i);
      const imgValue = new Images(i, fileRead[i].type, dataURL,fileRead[i].name);
      this.images.push(imgValue);
      console.log("after sorting"+this.images[0].fileName);
      console.log("addImage: "+dataURL);
    }

  }

    this.images.sort( (a, b) => {
      var x = a.fileName.toLowerCase();
      var y = b.fileName.toLowerCase();
      if (x < y) {return -1;}
      if (x > y) {return 1;}
      return 0;
    });
    this.imagesModified.emit(this.images.slice());
    if(this.images.length > 1) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
  }


async loadArray(fileRead:any,i:number) {
  const result = await new Promise((resolve) => {
    let reader = new FileReader();
    // console.log("++++++++++++fileRead["+i+"]"+ fileRead[i]);
     if(fileRead[i].type == "image/tiff"){
        reader.onload = (event: any) => {
            var image = new Tiff({ buffer: event.target.result });
            var canvas = image.toCanvas();
            var img = convertCanvasToImage(canvas) ;
            resolve(img.src);
            }
            reader.readAsArrayBuffer(fileRead[i]);
        }else
        {
          reader.onload = (event: any) => {
          resolve(event.target.result);
        }
        reader.readAsDataURL(fileRead[i]);
      }
    });
    console.log(result);
    return result;
}

openModalDialog(images :Images[],display){
  console.log("images count inside subscribe: "+images.length);
  this.btnImgArray.splice(0,this.btnImgArray.length);
  for(let i=0; i < images.length; i++) {
    var btnImgEle = "<button  style=\"width: 100%; border: none;\" (click)=\"openThisImage()\" class=\"btnImg\" value=\""+images[i].fileName+"\"  id=\""+images[i].id+"\">"+images[i].fileName+"</button>";
    console.log("btnImgEle: "+btnImgEle);
    this.btnImgArray.push(btnImgEle);
    this.btnImgArrayChange.emit(this.btnImgArray.slice());
  }
  console.log("images count inside btnImgArray: "+this.btnImgArray.length);
  $(".modal-body").empty();
  for(let i=0; i < this.btnImgArray.length; i++) {
    $(".modal-body").append(this.btnImgArray[i]);

  }
  console.log("opening........")
  display='block';
  this.displayChange.emit(display);
}

nextPage()
  {
    this.images = this.getImages();
    this.imgFileCount++;
    console.log("next image length"+this.images.length);
    this.localUrl = this.images[this.imgFileCount].imagePath;
    this.urlChanged.emit(this.localUrl);
    this.fileName = this.images[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    console.log("inside Next this.imgFileCount after incrementing: "+this.imgFileCount);
    if(this.images.length -1 == this.imgFileCount)
    {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
    }
    if( this.imgFileCount>0)
    {
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }

  }

previousPage()
  {
    this.images = this.getImages();
    this.imgFileCount--;
    this.localUrl = this.images[this.imgFileCount].imagePath;
    this.urlChanged.emit(this.localUrl);
    this.fileName = this.images[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    console.log("inside Next this.imgFileCount after decrementing: "+this.imgFileCount);
    if(this.images.length-1 >this.imgFileCount)
    {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
    if( this.imgFileCount==0)
    {
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }
  }



  LastImage(){
    this.images = this.getImages();
    this.imgFileCount=this.images.length-1;
    this.localUrl = this.images[this.imgFileCount].imagePath;
    this.urlChanged.emit(this.localUrl);
    this.fileName = this.images[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    if(this.images.length-1 == this.imgFileCount)
    {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }
  }

  firstImage(){
    this.images = this.getImages();
      this.imgFileCount=0;
      this.localUrl = this.images[this.imgFileCount].imagePath;
      this.urlChanged.emit(this.localUrl);
      this.fileName = this.images[this.imgFileCount].fileName;
      this.fileNameChange.emit(this.fileName);
      if(this.imgFileCount==0)
      {
        this.previousImages=true;
        this.previousImageChange.emit(this.previousImages);
        this.nextImages=false;
        this.nextImageChange.emit(this.nextImages);
      }
  }

}
function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  return image;
}
