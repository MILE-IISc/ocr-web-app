import { EventEmitter, Injectable, OnInit } from '@angular/core';

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

  nextImage = true;
  previousImage=true;
  imageLoaded = new EventEmitter<Images>();
  imagesModified = new EventEmitter<Images[]>();
  nextImageChange = new EventEmitter<boolean>();
  previousImageChange = new EventEmitter<boolean>();
  images: Array<Images> = [];
  imgFileCount = 0;
  ready = false;

  getImages() {
    return this.images.slice();
  }

  async addImage(fileRead){
    this.images.splice(0,this.images.length);
    var filesCount = fileRead.length;
    console.log("file count"+filesCount);
    for (let i=0; i<filesCount; i++){
      console.log("fileRead.type : "+fileRead[i].type);
      console.log("fileRead["+i+"].name : "+fileRead[i].name);
      let dataURL = await this.loadArray(fileRead,i);
      const imgValue = new Images(i, fileRead[i].type, dataURL,fileRead[i].name);
      this.images.push(imgValue);
      console.log("after sorting"+this.images[0].fileName);
      console.log("addImage: "+dataURL);
    }

    this.images.sort( (a, b) => {
      var x = a.fileName.toLowerCase();
      var y = b.fileName.toLowerCase();
      if (x < y) {return -1;}
      if (x > y) {return 1;}
      return 0;
    });
    this.imagesModified.emit(this.images.slice());
  }


async loadArray(fileRead:any,i:number) {
  const result = await new Promise((resolve) => {
    let reader = new FileReader();
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
}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  return image;
}
