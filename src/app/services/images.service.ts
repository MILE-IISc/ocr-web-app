import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as $ from 'jquery';
import { Subject, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Images } from '../shared/images.model';
import { HeaderService } from '../services/header.service';
import { XmlModel,retain } from '../shared/xml-model';

declare var Tiff: any;
declare var $:any;

@Injectable()
export class ImageService implements OnInit {
  displayImages;

  ngOnInit(): void {
    this.imageLoaded
      .subscribe(
        (images: Images) => {
          console.log("imageLoaded:+++++++++++++++++++++++++++++ ");
        }
      );
      this.percentage = this.headerService.getpercentagevary();
      this.headerService.percentageChange
        .subscribe(
          (percent: number) => {
            this.percentage = percent;
          });
  }

  private serverImages: Images[] = [];
  private imagesUpdated = new Subject<{ serverImages: Images[] }>();
  private waveSub: Subscription;
  fit: string;
  fileName;
  public nextImages = false;
  public previousImages = false;
  btnImgArrayChange = new EventEmitter<any>();
  imageLoaded = new EventEmitter<Images>();
  imagesModified = new EventEmitter<Images[]>();
  nextImageChange = new EventEmitter<boolean>();
  isSelectBlockChange = new EventEmitter<boolean>();
  displayChange = new EventEmitter<any>();
  nextValueChange = new EventEmitter<any>();
  previousImageChange = new EventEmitter<boolean>();
  documentChange = new EventEmitter<any>();
  fileNameChange = new EventEmitter<any>();
  images: Array<Images> = [];
  imgFileCount = 0;
  ready = false;
  percentage: number;
  btnImgArray: any[] = [];
  public localUrl: any;
  public documentElement;
  //display='none';
  // public serverImages: any[] = [];
  postedImages: any;
  serverUrl: any
  dataUrl: any;
  xmlFileName;
  BACKEND_URL;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService,private headerService: HeaderService, @Inject(DOCUMENT) private document: Document) {
    console.log("APP_BASE_HREF "+this.document.location.origin);
    this.BACKEND_URL = this.document.location.origin + "/api/image/";
    console.log("BACKEND_URL "+this.BACKEND_URL);
  }

  getImages() {
    return this.serverImages.slice();
  }

  getBtnImages() {
    return this.btnImgArray.slice();
  }

  async getServerImages() {
    var user = this.authService.userName;
    
    const queryParams = `?user=${user}`;

    console.log("enter get server from screen")
    let promise = new Promise((resolve, reject) => {
      this.http
        .get<{ message: string; images: [] }>(
          this.BACKEND_URL + queryParams
        ).toPromise()
        .then(responseData => {
          const imageLength = responseData.images.length;
          if (imageLength > 0) {
            this.serverImages = responseData.images;
            console.log("message" + responseData.message);
            console.log("server images length--" + this.serverImages.length);
            this.imagesUpdated.next({
              serverImages: [...this.serverImages]
            });
          }
          else {
            console.log("message" + responseData.message);
            this.serverImages = responseData.images;
            this.imagesUpdated.next({
              serverImages: []
            });
          }
          resolve(this.serverImages);
        });
    });
    return promise;
  }

  getWaveUpdateListener() {
    return this.imagesUpdated.asObservable();
  }

  setDocumentId(element) {
    this.documentElement = element;
    this.documentChange.emit(this.documentElement);
  }

  getDocumentId() {
    return this.documentElement.slice();
  }

  urlChanged = new EventEmitter<string>();
  url: string;

  setUrl(localUrl) {
    this.url = localUrl;
    this.urlChanged.emit(this.url);
  }

  getUrl() {
    return this.url;
  }

  async addImage(fileRead) {
    // console.log("fileRead"+fileRead);
    const imageData = new FormData();
    imageData.append("email", this.authService.userName);
    // console.log("file name before server call "+fileRead[0].name.slice(0,-9));
    imageData.append("folderName",fileRead[0].name.slice(0,-9));
    for (let i = 0; i < fileRead.length; i++) {
      var file = fileRead[i];
      console.log(file.name);
      console.log(fileRead.length)
      imageData.append("image", file);
    }
    this.http
      .post<{ message: string }>(
        this.BACKEND_URL,
        imageData
      )
      .subscribe(async responseData => {
        console.log("image: " + responseData.message);
        await this.getServerImages();
      });
    if (this.serverImages.length > 0) {
      console.log("server images length===" + this.serverImages.length);
      // this.images.splice(0, this.images.length);
      var filesCount = this.serverImages.length;
      if (filesCount > 1) {
        this.nextImages = false;
      }
      console.log("file count" + filesCount);
      let dataURL = await this.loadArray(this.serverImages[0].imagePath);
      this.serverUrl = dataURL
      console.log("server urlssssss" + this.serverUrl);
      this.urlChanged.emit(this.serverUrl.slice());
      console.log("(this.serverImages[0]: " + this.serverImages[0]);
      if (this.serverImages.length > 1) {
        this.nextImages = false;
        this.nextImageChange.emit(this.nextImages);
      }
    }
  }

  getImage(imageUrl: any){
    console.log("inside getImage"+imageUrl)
    return this.http.get(imageUrl, { responseType: 'blob' });
  }

  

  async loadArray(serverImage: any) {
    console.log("inside load array");
    const result = await new Promise((resolve) => {
      this.getImage(serverImage).subscribe(data => {
        console.log("data----" + data.type);
        let reader = new FileReader();
        //if else condition comes here
        if (data.type == "image/tiff") {
          reader.onload = (event: any) => {
            var image = new Tiff({ buffer: event.target.result });
            var canvas = image.toCanvas();
            var img = convertCanvasToImage(canvas);
            resolve(img.src);
          }
          reader.readAsArrayBuffer(data);
        }
        else {
          reader.onload = (event: any) => {
            console.log("data url=====================================" + event.target.result);
            resolve(event.target.result);
          }
          reader.readAsDataURL(data);
        }
      });
    });
    return result;
  }

  updateXml(xmlString: any, fileName: any) {
    let xmlData: any;
    xmlData = {
      xml: xmlString,
      fileName: fileName,
      folderName : fileName.slice(0,-9)
    };
    this.http
      .put<{ message: string, name: string, completed: string }>(this.BACKEND_URL + fileName, xmlData)
      .subscribe(response => {
        for (let i = 0; i < this.serverImages.length; i++) {
          if (this.serverImages[i].fileName == response.name) {
            console.log("name" + this.serverImages[i].fileName);
            this.serverImages[i].completed = response.completed;
            console.log("completed" + this.serverImages[i].completed);
      
          }
        }
      });
  }

  openModalDialog(images: Images[], display) {
    console.log("images count inside subscribe: " + images.length);
    this.btnImgArray.splice(0, this.btnImgArray.length);
    for (let i = 0; i < images.length; i++) {
      var btnImgEle = "<button  style=\"width: 100%; border: none;\" (click)=\"openThisImage()\" class=\"btnImg\" value=\"" + images[i].fileName + "\"  id=\"" + images[i]._id + "\">" + images[i].fileName + "</button>";
      console.log("btnImgEle: " + btnImgEle);
      this.btnImgArray.push(btnImgEle);
      this.btnImgArrayChange.emit(this.btnImgArray.slice());
    }
    console.log("images count inside btnImgArray: " + this.btnImgArray.length);
    $(".modal-body").empty();
    for (let i = 0; i < this.btnImgArray.length; i++) {
      $(".modal-body").append(this.btnImgArray[i]);

    }
    console.log("opening........")
    display = 'block';
    this.displayChange.emit(display);
  }

  async nextPage() {
    this.imgFileCount++;
    console.log("next image length" + this.serverImages.length);
    this.localUrl = await this.loadArray(this.serverImages[this.imgFileCount].imagePath);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.serverImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    console.log("inside Next this.imgFileCount after incrementing: " + this.imgFileCount);
    if (this.serverImages.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
    }
    if (this.imgFileCount > 0) {
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }
  }

  async previousPage() {
    this.serverImages = this.getImages();
    this.imgFileCount--;
    this.localUrl = await this.loadArray(this.serverImages[this.imgFileCount].imagePath);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.serverImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    console.log("inside Next this.imgFileCount after decrementing: " + this.imgFileCount);
    if (this.serverImages.length - 1 > this.imgFileCount) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
    if (this.imgFileCount == 0) {
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }
  }

  async LastImage() {
    this.serverImages = this.getImages();
    this.imgFileCount = this.serverImages.length - 1;
    this.localUrl = await this.loadArray(this.serverImages[this.imgFileCount].imagePath);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.serverImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    if (this.serverImages.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }
  }

  async firstImage() {
    this.serverImages = this.getImages();
    this.imgFileCount = 0;
    this.localUrl = await this.loadArray(this.serverImages[this.imgFileCount].imagePath);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.serverImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    if (this.imgFileCount == 0) {
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
  }

  onXml(){


this.serverImages = this.getImages();
var url
this.fileName = this.serverImages[this.imgFileCount].fileName;
console.log("filename"+this.fileName)
 for (let i =0; i< this.serverImages.length;i++){
   if (this.serverImages[i].fileName == this.fileName && this.serverImages[i].completed == 'Y'){
  url = this.serverImages[i].imagePath.slice(0,-3)+ 'xml'
  var xmlhttp = new XMLHttpRequest();
    
  xmlhttp.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
  
  fromXml(this);
  }
  };
  
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
   }
 }
console.log("patth"+url)
  
    // var xmlhttp = new XMLHttpRequest();
    
    // xmlhttp.onreadystatechange = function () {
    // if (this.readyState == 4 && this.status == 200) {
    
    // fromXml(this);
    // }
    // };
    
    // xmlhttp.open("GET", url, true);
    // xmlhttp.send();
    }
}
function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image source"+image.src);
  return image;
}
function fromXml(xml){
  var arr=[];
  
console.log("the current percentage is "+retain.percentage)
var xmlDoc = xml.responseXML;
var block = xmlDoc.getElementsByTagName("block");
console.log("length =====" + block.length);
let areaarray=[];
for (let i = 0; i < block.length; i++) {

var blockNumber  = (block[i].getAttribute('BlockNumber'));
console.log("blockNumber"+blockNumber);
var blockRowStart = (block[i].getAttribute('rowStart'));
var blockRowEnd = (block[i].getAttribute('rowEnd'));
var blockColStart = (block[i].getAttribute('colStart'));
var blockColEnd = (block[i].getAttribute('colEnd'));
var blockwidth = (blockColEnd - blockColStart) * retain.percentage / 100;
console.log("blockwidth"+blockwidth);
var blockheight = (blockRowEnd - blockRowStart) * retain.percentage / 100;
console.log("blockheight"+blockheight);
var X = blockColStart * retain.percentage/ 100;
console.log("blockX"+X);
var Y = blockRowStart *  retain.percentage / 100;
console.log("blockY"+Y);
 areaarray[i] = { "id":blockNumber, "x":X,"y":Y,"width":blockwidth,"height":blockheight}

 $('img#imgToRead').selectAreas('destroy');
 $('img#imgToRead').selectAreas({
 
 onChanged : debugQtyAreas,
 
 areas:areaarray
 
 });

}

$('#nextImg').click(function () {
  console.log("onclick");
  $('#imgToRead').selectAreas('destroy');
});
$('#previousImg').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#firstImg').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#lastImg').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#butZoomIn').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#butZoomOut').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#fitWidth').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#fitHeigth').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#100zoom').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#zoom').click(function () {
  $('#imgToRead').selectAreas('destroy');
});
$('#buttonXml').click(function () {
  console.log("onclick");
  $('#imgToRead').selectAreas('destroy');
});
  

function debugQtyAreas(event, id, areas) {
console.log(areas.length + " areas", arguments);
this.displayarea = areas;
console.log(areas.length + " this.displayarea", arguments);
};
}
