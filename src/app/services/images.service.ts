import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, OnInit, Renderer2, RendererFactory2 } from '@angular/core';
import { Router } from '@angular/router';
import * as $ from 'jquery';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Images } from '../shared/images.model';
import { HeaderService } from '../services/header.service';
import { XmlModel, retain } from '../shared/xml-model';
import { BlockModel } from '../shared/block-model';
// import { HeaderService } from '../services/header.service';
import * as xml2js from 'xml2js';


declare var Tiff: any;
declare var $: any;

@Injectable()
export class ImageService implements OnInit {
  displayImages;

  ngOnInit(): void {
    this.percentage = this.headerService.getpercentagevary();
    this.headerService.percentageChange
      .subscribe(
        (percent: number) => {
          this.percentage = percent;
        });
  }

  images: Array<Images> = [];
  localImages: Array<Images> = [];
  imgFileCount = 0;
  private imagesUpdated = new Subject<{ localImages: Images[] }>();

  fileName;
  public nextImages = false;
  public previousImages = false;
  imageCountChange = new EventEmitter<Number>();
  btnImgArrayChange = new EventEmitter<any>();
  nextImageChange = new EventEmitter<boolean>();
  isSelectBlockChange = new EventEmitter<boolean>();
  displayChange = new EventEmitter<any>();
  nextValueChange = new EventEmitter<any>();
  previousImageChange = new EventEmitter<boolean>();
  documentChange = new EventEmitter<any>();
  fileNameChange = new EventEmitter<any>();
  invalidMessageChange = new EventEmitter<any>();
  ocrMessageChange = new EventEmitter<any>();
  ready = false;

  btnImgArray: any[] = [];
  public localUrl: any;
  public documentElement;
  postedImages: any;
  serverUrl: any
  dataUrl: any;
  xmlFileName;
  IMAGE_BACKEND_URL;
  XML_BACKEND_URL;
  invalidMessage;
  ocrMessage;
  value: string;
  fit: string;
  public percentage: number;
  public angle: number = 0;
  private renderer: Renderer2;
  public clientpercent;
  obtainblock = false;
  isRunningOcr = false;
  isRunningOcrChange = new EventEmitter<any>();
  isLoadingFromServer = false;
  isLoadingFromServerChange = new EventEmitter<any>();

  constructor(rendererFactory: RendererFactory2, private http: HttpClient, private router: Router, private authService: AuthService, private headerService: HeaderService, @Inject(DOCUMENT) private document: Document) {
    this.IMAGE_BACKEND_URL = this.authService.BACKEND_URL + "/api/image/";
    this.XML_BACKEND_URL = this.authService.BACKEND_URL + "/api/xml/";
    console.log("IMAGE_BACKEND_URL " + this.IMAGE_BACKEND_URL);
    console.log("XML_BACKEND_URL " + this.XML_BACKEND_URL);
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  getLocalImages() {
    return this.localImages.slice();
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
          this.IMAGE_BACKEND_URL + queryParams
        ).toPromise()
        .then(responseData => {
          const imageLength = responseData.images.length;
          if (imageLength > 0) {
            this.localImages = responseData.images;
            console.log("message" + responseData.message);
            console.log("server images length--" + this.localImages.length);
            this.imagesUpdated.next({ localImages: [...this.localImages] });
            // this.isLoadingFromServer = false;
            this.isLoadingFromServerChange.emit(false);
          }
          else {
            console.log("message" + responseData.message);
            this.localImages = responseData.images;
            this.imagesUpdated.next({ localImages: [] });
            // this.isLoadingFromServer = false;
            this.isLoadingFromServerChange.emit(false);
          }
          resolve(this.localImages);
        });

    });
    return promise;

  }

  getXmlFileAsJson(fileName: any) {
    console.log("file name in run ocr " + fileName)
    const queryParams = `?fileName=${fileName}&type=GET-OCR-XML`;
    this.http.get<{ message: string; xmlData: any }>(this.XML_BACKEND_URL + queryParams).subscribe(response => {
      console.log("xml as json string on RUN-OCR" + JSON.stringify(response.xmlData));
      XmlModel.jsonObject = response.xmlData;
      this.updateXmlModel(XmlModel.jsonObject);
      this.isRunningOcr = false;
      this.isRunningOcrChange.emit(this.isRunningOcr);
      this.ocrMessage = response.message;
      this.ocrMessageChange.emit(this.ocrMessage);
    });
  }

  updateXmlModel(jsonObj) {
    console.log("jsonObj inside updateXmlModel after running OCR", jsonObj);
    var blocks = [];
    if (jsonObj['page'].block) {
      blocks = jsonObj['page'].block;
    }
    console.log("block length " + blocks.length);
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].line) {
        var lines = blocks[i].line;
        console.log("line====" + lines.length);
        for (var j = 0; j < lines.length; j++) {
          if (lines[j].word) {
            var txt = "";
            var words = lines[j].word;
            console.log("words length " + words.length);
            for (var k = 0; k < words.length; k++) {
              if (words[k]["$"].unicode != null) {
                console.log("words[" + k + "][\"$\"].unicode", words[k]["$"].unicode);
                txt = txt + " " + words[k]["$"].unicode;
              }
            }
            var lineRowStart = lines[j]["$"].rowStart;
            var lineRowEnd = lines[j]["$"].rowEnd;
            var lineColStart = lines[j]["$"].colStart;
            var lineColEnd = lines[j]["$"].colEnd;
            var lineNumber = lines[j]["$"].LineNumber;
            var blockNumber = blocks[i]["$"].BlockNumber;
            var txtwidth = (lineColEnd - lineColStart);
            var txtheight = (lineRowEnd - lineRowStart);
            var wordValue = new XmlModel(txt, lineRowStart, lineRowEnd, lineColStart, lineColEnd, txtwidth, txtheight, lineNumber, blockNumber);
            XmlModel.textArray.push(wordValue);
            console.log("textarray length" + XmlModel.textArray.length);
            XmlModel.textArray.slice(0, XmlModel.textArray.length);
            console.log("textarray after length" + XmlModel.textArray.length);
            console.log("text " + txt);
          }
        }
      }
    }
  }

  getImageUpdateListener() {
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
    await this.getServerImages();
    console.log("server file count before post" + this.localImages.length);
    let imageData = new FormData();
    imageData.append("email", this.authService.userName);
    for (let i = 0; i < fileRead.length; i++) {
      var file = fileRead[i];
      console.log(file.name);
      console.log(fileRead.length)
      imageData.append("image", file);
    }
    this.http.post<{ message: string }>(this.IMAGE_BACKEND_URL, imageData).subscribe(async responseData => {
      this.invalidMessage = responseData.message;
      this.invalidMessageChange.emit(this.invalidMessage);
      console.log("image added+++++++++++++++++++: " + responseData.message);
    });

    console.log("server file count" + this.localImages.length);
    if (this.localImages.length == 0) {
      this.loadLocalImages(fileRead, "NEW");
    }
    else {
      this.loadLocalImages(fileRead, "APPEND");
    }
  }

  async loadLocalImages(fileRead, type) {
    if (type == "NEW") {
      // this.localImages.splice(0, this.localImages.length);
      this.localImages = [];
    }
    var filesCount = fileRead.length;
    console.log("file count" + filesCount);
    for (let i = 0; i < filesCount; i++) {
      var isImage = fileRead[i].type.includes("image");
      if (isImage) {
        console.log("fileRead.type : " + fileRead[i].type);
        console.log("fileRead[" + i + "].name : " + fileRead[i].name);
        let dataURL = await this.loadLocalImageData(fileRead, i);
        const imgValue = new Images(i, fileRead[i].name, 'N', this.authService.userName, dataURL);
        this.localImages.push(imgValue);
      }
    }
    this.localImages.sort((a, b) => {
      var x = a.fileName.toLowerCase();
      var y = b.fileName.toLowerCase();
      if (x < y) { return -1; }
      if (x > y) { return 1; }
      return 0;
    });
    console.log("localImages Count after Upload", this.localImages.length);
    this.imagesUpdated.next({ localImages: [...this.localImages] });
    if (this.localImages.length > 1) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
  }

  async loadLocalImageData(fileRead: any, i: number) {
    const result = await new Promise((resolve) => {
      let reader = new FileReader();
      if (fileRead[i].type == "image/tiff") {
        reader.onload = (event: any) => {
          var image = new Tiff({ buffer: event.target.result });
          var canvas = image.toCanvas();
          var img = convertCanvasToImage(canvas);
          resolve(img.src);
        }
        reader.readAsArrayBuffer(fileRead[i]);
      } else {
        reader.onload = (event: any) => {
          resolve(event.target.result);
        }
        reader.readAsDataURL(fileRead[i]);
      }
    });
    console.log(result);
    return result;
  }


  async loadArray(serverImage: any) {
    console.log("inside load array");
    console.log("inside load array", serverImage);

    let promise = new Promise((resolve, reject) => {
      var user = this.authService.userName;
      const queryParams = `?user=${user}`;
      this.http.get<{ message: string; json: any }>(this.IMAGE_BACKEND_URL + serverImage + queryParams).subscribe(responseData => {
        resolve(responseData.json);
      });
    });
    return promise;
  }

  updateCorrectedXml(fileName: any) {
    console.log("Corrected xml " + JSON.stringify(XmlModel.jsonObject));
    let jsonData: any;
    jsonData = {
      json: XmlModel.jsonObject,
      XmlfileName: fileName.slice(0, -3) + 'xml',
      user: this.authService.userName
    };
    this.http
      .put<{ message: string, completed: string }>(this.XML_BACKEND_URL, jsonData)
      .subscribe(response => {
        console.log("response message after correction " + response.message);
        this.localImages = this.getLocalImages();
        console.log("server image length in update " + this.localImages.length);
        if (this.localImages.length > 0) {
          for (let i = 0; i < this.localImages.length; i++) {
            console.log("jsonData.XmlfileName ", jsonData.XmlfileName, "this.localImages[" + i + "].fileName ", this.localImages[i].fileName);
            if (this.localImages[i].fileName.slice(0, -3) + 'xml' == jsonData.XmlfileName) {
              console.log("name" + this.localImages[i].fileName);
              this.localImages[i].completed = response.completed;
              console.log("response completed " + response.completed);
              console.log("completed" + this.localImages[i].completed);
            }
          }
        } else {
          for (let i = 0; i < this.localImages.length; i++) {
            if (this.localImages[i].fileName.slice(0, -3) + 'xml' == jsonData.XmlfileName) {
              console.log("name" + this.localImages[i].fileName);
              this.localImages[i].completed = response.completed;
              console.log("completed" + this.localImages[i].completed);
            }
          }
        }
      });
  }

  openModalDialog(images: Images[]) {
    console.log("images count inside subscribe: " + images.length);
    this.btnImgArray.splice(0, this.btnImgArray.length);
    for (let i = 0; i < images.length; i++) {
      var btnImgEle = "<button  style=\"width: 100%; border: none;\" (click)=\"openThisImage()\" class=\"btnImg\" value=\"" + images[i].fileName + "\"  id=\"" + images[i]._id + "\">" + images[i].fileName + "</button>";
      console.log("btnImgEle: " + btnImgEle);
      this.btnImgArray.push(btnImgEle);
      this.btnImgArrayChange.emit(this.btnImgArray.slice());
    }
    console.log("images count inside btnImgArray: " + this.btnImgArray.length);
    $(".sideBody").empty();
    for (let i = 0; i < this.btnImgArray.length; i++) {
      $(".sideBody").append(this.btnImgArray[i]);

    }
    console.log("opening........")

  }

  async nextPage() {
    this.imgFileCount++;
    this.imageCountChange.emit(this.imgFileCount);
    this.localImages = this.getLocalImages();
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();

    this.localImages = this.getLocalImages();
    console.log("localImages count", this.localImages.length);
    console.log("index of image to be displayed", this.imgFileCount);
    if (this.localImages[this.imgFileCount].dataUrl == null || this.localImages[this.imgFileCount].dataUrl == "") {
      this.localImages[this.imgFileCount].dataUrl = await this.loadArray(this.localImages[this.imgFileCount].fileName);
    }
    this.localUrl = this.localImages[this.imgFileCount].dataUrl;
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.localImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    console.log("inside Next this.imgFileCount after incrementing: " + this.imgFileCount);

    if (this.localImages.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
    }
    if (this.imgFileCount > 0) {
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }
    if (this.obtainblock == true) {
      this.onXml();
    }
  }

  onXMLservice() {
    if (this.obtainblock == true) {
      this.onXml();
    }
  }

  async previousPage() {
    this.imgFileCount--;
    this.imageCountChange.emit(this.imgFileCount);
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();

    this.localImages = this.getLocalImages();
    console.log("localImages count", this.localImages.length);
    console.log("index of image to be displayed", this.imgFileCount);
    if (this.localImages[this.imgFileCount].dataUrl == null || this.localImages[this.imgFileCount].dataUrl == "") {
      this.localImages[this.imgFileCount].dataUrl = await this.loadArray(this.localImages[this.imgFileCount].fileName);
    }
    this.localUrl = this.localImages[this.imgFileCount].dataUrl;
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.localImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    console.log("inside Next this.imgFileCount after decrementing: " + this.imgFileCount);
    if (this.localImages.length - 1 > this.imgFileCount) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
    if (this.imgFileCount == 0) {
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }
    if (this.obtainblock == true) {
      this.onXml();
    }
  }

  async LastImage() {
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();

    this.localImages = this.getLocalImages();
    this.imgFileCount = this.localImages.length - 1;
    this.imageCountChange.emit(this.imgFileCount);
    if (this.localImages[this.imgFileCount].dataUrl == null || this.localImages[this.imgFileCount].dataUrl == "") {
      this.localImages[this.imgFileCount].dataUrl = await this.loadArray(this.localImages[this.imgFileCount].fileName);
    }
    this.localUrl = this.localImages[this.imgFileCount].dataUrl;
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.localImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);
    if (this.localImages.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }
    if (this.obtainblock == true) {
      this.onXml();
    }
  }

  async firstImage() {
    this.imgFileCount = 0;
    this.imageCountChange.emit(this.imgFileCount);
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();

    this.localImages = this.getLocalImages();
    if (this.localImages[this.imgFileCount].dataUrl == null || this.localImages[this.imgFileCount].dataUrl == "") {
      this.localImages[this.imgFileCount].dataUrl = await this.loadArray(this.localImages[this.imgFileCount].fileName);
    }
    this.localUrl = this.localImages[this.imgFileCount].dataUrl;
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.localImages[this.imgFileCount].fileName;
    this.fileNameChange.emit(this.fileName);

    if (this.imgFileCount == 0) {
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
    if (this.obtainblock == true) {
      this.onXml();
    }
  }

  buttonenable() {
    if (this.localImages.length - 1 == 0) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }

    else if (this.localImages.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }

    else if ((this.localImages.length - 1 > 0) && (this.imgFileCount == 0)) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }
    else if ((this.localImages.length - 1 > 0) && (this.localImages.length - 1 !== this.imgFileCount)) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }

  }

  onXml() {
    this.localImages = this.getLocalImages();
    console.log("localImages in onXml", this.localImages.length);
    if (this.localImages.length > 0) {
      console.log("server image length " + this.localImages.length);
      console.log("image file count " + this.imgFileCount);
      this.fileName = this.localImages[this.imgFileCount].fileName;
      console.log("completion status: ", this.localImages[this.imgFileCount].completed);
      if (this.localImages[this.imgFileCount].completed == "Y") {
        this.getFileAsJson(this.fileName);
      }
    } else {
      this.localImages = this.getLocalImages();
      this.fileName = this.localImages[this.imgFileCount].fileName;
      console.log("completion status: ", this.localImages[this.imgFileCount].completed);
      if (this.localImages[this.imgFileCount].completed == "Y") {
        this.getFileAsJson(this.fileName);
      }
    }
  }

  getFileAsJson(fileName: any) {
    console.log("file name in run ocr " + fileName);
    const queryParams = `?fileName=${fileName}&type=GET-XML`;
    this.http.get<{ message: string; xmlData: any }>(this.XML_BACKEND_URL + queryParams).subscribe(response => {
      console.log("reponseData in getFileAsJson", response.xmlData);
      console.log("xml as json string " + JSON.stringify(response.xmlData));
      XmlModel.jsonObject = response.xmlData;
      this.retain(XmlModel.jsonObject);
      this.updateXmlModel(XmlModel.jsonObject);
      // if(XmlModel.jsonObject['page'].block){
      //   var blocks = XmlModel.jsonObject['page'].block;
      //   for(let i =0;i<blocks.length;i++){
      //     if(blocks[i].line){
      //       console.log("lines are present");
      //       this.updateXmlModel(jsonObj)
      //     }
      //   }
      // }
    });
  }

  retain(jsonObj) {
    let areaarray = [];
    // var jsonObj = JSON.parse(json);
    console.log("inside retain jsonObj: " + JSON.stringify(jsonObj));
    if (jsonObj['page'].block) {
      var blocks = jsonObj['page'].block;
      //  console.log("block length " + blocks.length);

      for (var i = 0; i < blocks.length; i++) {
        var blockNumber = (blocks[i]["$"].BlockNumber);
        console.log("blockNumber" + blockNumber);
        console.log("blockRowStart from json " + blocks[i].rowStart);
        var blockRowStart = blocks[i]["$"].rowStart;
        var blockRowEnd = blocks[i]["$"].rowEnd;
        var blockColStart = blocks[i]["$"].colStart;
        var blockColEnd = blocks[i]["$"].colEnd;
        var x = (blockColEnd - blockColStart);
        console.log("x in retain " + x);
        console.log("percentage in retain ***************" + this.percentage);
        var blockwidth = (blockColEnd - blockColStart) * this.percentage / 100;
        console.log("blockwidth" + blockwidth);
        var blockheight = (blockRowEnd - blockRowStart) * this.percentage / 100;
        console.log("blockheight" + blockheight);
        var X = blockColStart * this.percentage / 100;
        console.log("blockX" + X);
        var Y = blockRowStart * this.percentage / 100;
        console.log("blockY" + Y);
        areaarray[i] = { "id": blockNumber, "x": X, "y": Y, "width": blockwidth, "height": blockheight };
      }
    }
    $('img#imgToRead').selectAreas('destroy');
    $('img#imgToRead').selectAreas({
      onChanged: debugQtyAreas,
      areas: areaarray
    });

    $('#buttonXml').click(function () {
      console.log("onclick");
      $('#imgToRead').selectAreas('destroy');
    });
    $('.btnImg').click(function () {
      $('#imgToRead').selectAreas('reset');
    });
    function debugQtyAreas(event, id, areas) {
      console.log(areas.length + " areas", arguments);
      this.displayarea = areas;
      console.log(areas.length + " this.displayarea", arguments);
    };
  }

  screenview() {
    if (this.fit == 'width') {
      this.clientpercent = this.percentage;
      setTimeout(() => this.fitwidth(), 50);
      var block;
      block = document.getElementsByClassName("select-areas-outline");
      if (block.length > 0) { setTimeout(() => this.blocksize(), 50); }

    }
    else if (this.fit == 'height') {
      setTimeout(() => this.fitheight(), 50);
    }
    else if (this.fit == 'orginalsize') {
      setTimeout(() => this.orginalsize(), 50);
    }
    else if (this.fit == 'bypercentage') {
      setTimeout(() => this.sizebypercentage(), 50);
    }

  };
  asVertical() {
    console.log("inside asVertical of Viewer");
    this.value = 'horizontal';
    // console.log("fit: "+fit);

    this.screenview()


  }
  asHorizontal() {
    this.value = 'vertical';
    console.log("fit inside screen Horizontal: " + this.fit);
    this.screenview()
  }



  fitheight() {
    this.clientpercent = this.percentage;
    console.log("inside fitheight of Viewer");
    this.fit = 'height';
    var myImg;
    var falseimg;
    myImg = document.getElementById("imgToRead");
    falseimg = document.getElementById("image")
    console.log("myImg: " + myImg);


    var divheight = document.getElementById("content").offsetHeight;
    console.log("divelementheight " + divheight)
    myImg.style.height = divheight + "px";
    falseimg.style.height = myImg.style.height;
    var currHeight = myImg.clientHeight;
    var realHeight = myImg.naturalHeight;
    var realWidth = myImg.naturalWidth;
    this.percentage = currHeight / realHeight * 100;
    this.headerService.setpercentagevary(this.percentage);

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }

    myImg.style.width = (realWidth * this.percentage / 100) + "px";
    falseimg.style.width = myImg.style.width;
  }

  fitwidth() {
    this.clientpercent = this.percentage;
    this.fit = 'width';
    var myImg;
    var falseimg;
    myImg = document.getElementById("imgToRead");
    falseimg = document.getElementById("image")


    var divwidth = document.getElementById('content').offsetWidth;
    console.log("divelementheight", divwidth);
    console.log("myImg on fitwidth", myImg);
    if (myImg != null) {
      myImg.style.width = divwidth + "px";
      falseimg.style.width = myImg.style.width;
      var currWidth = myImg.clientWidth;
      var realHeight = myImg.naturalHeight;
      var realWidth = myImg.naturalWidth;
      this.percentage = (currWidth / realWidth) * 100;
      this.headerService.setpercentagevary(this.percentage);

      // console.log("the current percentage is "+retain.percentage)
      //this.blocksize();

      myImg.style.height = (realHeight * this.percentage / 100) + "px";
      falseimg.style.height = myImg.style.height;
    }
  }
  orginalsize() {
    this.clientpercent = this.percentage;
    this.fit = 'orginalsize';
    var myImg;
    var falseimg;
    falseimg = document.getElementById("image")
    myImg = document.getElementById("imgToRead");
    myImg.style.width = myImg.naturalWidth + "px";

    falseimg.style.width = myImg.style.width;
    console.log("currwidth" + myImg.naturalWidth)
    myImg.style.height = myImg.naturalHeight + "px";
    falseimg.style.height = myImg.style.height;
    console.log("currheight" + myImg.naturalHeight)
    this.percentage = 100;
    this.headerService.setpercentagevary(this.percentage);

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }


  }
  getpercentage() {
    return this.percentage;
  }

  onZoom() {
    // this.clientpercent = this.percentage;
    this.fit = 'bypercentage';
    var myImg;
    var zoomlevel = this.percentage;
    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    var currWidth = myImg.clientWidth;
    var currHeight = myImg.clientHeight;
    myImg.style.width = (realWidth * zoomlevel / 100) + "px";
    console.log("currwidth" + currWidth)
    myImg.style.height = (realHeight * zoomlevel / 100) + "px";
    console.log("currheight" + currHeight)
    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;
    //  this.blocksize();
  }
  sizebypercentage() {
    var myImg;
    var zoomlevel = this.percentage;
    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;

    myImg.style.width = (realWidth * zoomlevel / 100) + "px";

    myImg.style.height = (realHeight * zoomlevel / 100) + "px";

    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;

  };

  zoomInFun() {
    this.clientpercent = this.percentage;
    this.fit = 'bypercentage';
    var myImg;
    this.percentage = this.percentage + 7.2;

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }

    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    var currWidth = myImg.clientWidth;
    var currHeight = myImg.clientHeight;
    myImg.style.width = (realWidth * this.percentage / 100) + "px";
    console.log("currwidth" + currWidth)
    myImg.style.height = (realHeight * this.percentage / 100) + "px";
    console.log("currheight" + currHeight)
    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;
  }

  zoomOutFun() {
    this.clientpercent = this.percentage;
    this.fit = 'bypercentage';
    var myImg;
    this.percentage = this.percentage - 7.2;

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }
    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    var currWidth = myImg.clientWidth;
    var currHeight = myImg.clientHeight;
    myImg.style.width = (realWidth * this.percentage / 100) + "px";
    console.log("currwidth" + currWidth)
    myImg.style.height = (realHeight * this.percentage / 100) + "px";
    console.log("currheight" + currHeight)
    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;
  }

  rotateImage() {
    this.angle = this.angle + 0.5;
    var myImg;
    var degree = this.angle;
    myImg = document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }

  rotateImageanti() {
    this.angle = this.angle - 0.5;
    var myImg;
    var degree = this.angle;
    myImg = document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }

  onEnter() {
    var myImg;
    var degree = this.angle;
    myImg = document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }

  selectBlockservice() {
    this.obtainblock = true;
    $('img#imgToRead').selectAreas('destroy');
    console.log("inside script");
    let areasarray = BlockModel.blockArray.reverse();
    console.log("block.model.arrray^^^^   ^^" + JSON.stringify(areasarray));
    // areasarray
    $('img#imgToRead').selectAreas({
      position: "absolute",
      onChanged: debugQtyAreas,
      areas: areasarray
    });

    function debugQtyAreas(event, id, areas) {
      console.log(areas.length + " areas", arguments);
      this.displayarea = areas;
    };

    var elems = $('.select-areas-background-area');
    var len = elems.length;
    console.log("select-areas-background-area length: " + len);
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        console.log("elem[" + i + "]" + elems[i]);
        console.log("elem[" + i + "]" + $('.select-areas-background-area').css("background"));
        $('.select-areas-background-area').bind()
      }
    }

  }


  blocksize() {
    if (this.percentage > 1) {
      BlockModel.blockArray.length = 0;
      var block
      block = document.getElementsByClassName("select-areas-outline");
      for (var i = 0; i < block.length; i++) {
        var blocktop = block[i].style.top;
        blocktop = blocktop.substring(0, blocktop.length - 2);
        var blockleft = block[i].style.left;
        blockleft = blockleft.substring(0, blockleft.length - 2);
        var constantfactortop = (blocktop / this.clientpercent);
        var constantfactorwidth = (block[i].clientWidth / this.clientpercent);
        var constantfactorheight = (block[i].clientHeight / this.clientpercent);
        var constantfactorleft = (blockleft / this.clientpercent);
        var id = i;
        var x = constantfactorleft * this.percentage;
        var y = constantfactortop * this.percentage;
        var width = constantfactorwidth * this.percentage;
        var height = constantfactorheight * this.percentage;
        var z = 0
        var blockValue = new BlockModel(height, id, width, x, y, z);
        BlockModel.blockArray.push(blockValue);
        // this.viewerService. selectBlockservice()
        // setTimeout(() =>  this. selectBlockservice(),.001);

      }

      $('img#imgToRead').selectAreas('destroy');
      console.log("inside script");
      let areasarray = BlockModel.blockArray.reverse();
      console.log("block.model.arrray^^^^   ^^" + JSON.stringify(areasarray));
      $('img#imgToRead').selectAreas({
        position: "absolute",

        areas: areasarray
      });
    }
  }



  blocknumberupdate() {
    this.clientpercent = this.percentage;
    this.blocksize()
  }
  unselectBlock() {
    this.obtainblock = false;
    $('img#imgToRead').selectAreas('destroy');

  };

  onSave() {
    console.log("in xml save");
    var areas = $('img#imgToRead').selectAreas('areas');
    var prolog = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    var ns1 = 'http://mile.ee.iisc.ernet.in/schemas/ocr_output';
    var xmlDocument = document.implementation.createDocument(null, "page", null);
    xmlDocument.documentElement.setAttribute("xmlns", ns1);
    for (let i = 0; i < areas.length; i++) {
      var blockElem = xmlDocument.createElementNS(null, "block");
      blockElem.setAttribute("type", "Text");
      var blockNumberElems = $(".select-areas-blockNumber-area");
      console.log("-----blockNumberElems------" + blockNumberElems.length);
      var blockNumber = document.getElementsByClassName('select-areas-blockNumber-area');
      console.log("block number" + blockNumber[(blockNumberElems.length - 1) - i].innerHTML)
      blockElem.setAttribute("BlockNumber", blockNumber[(blockNumberElems.length - 1) - i].innerHTML);
      blockElem.setAttribute("SubType", "paragraphProse");
      var y = ((areas[i].y * 100) / this.percentage).toString();
      console.log("this.percentage--------" + this.percentage)
      blockElem.setAttribute("rowStart", (Math.ceil(parseInt(y))).toString());
      var height = ((areas[i].height * 100) / this.percentage);
      var rowEnd = (height + parseFloat(y)).toString();
      blockElem.setAttribute("rowEnd", (Math.ceil(parseInt(rowEnd))).toString());
      var x = ((areas[i].x * 100) / this.percentage).toString();
      blockElem.setAttribute("colStart", (Math.ceil(parseInt(x))).toString());
      var width = ((areas[i].width * 100) / this.percentage);
      var colEnd = (width + parseFloat(x)).toString();
      blockElem.setAttribute("colEnd", (Math.ceil(parseInt(colEnd))).toString());
      // blockElem.removeAttribute("xmlns");
      xmlDocument.documentElement.appendChild(blockElem);
    }
    var xmlString = new XMLSerializer().serializeToString(xmlDocument);
    console.log("xml string " + xmlString);

    xml2js.parseString(xmlString, function (err, result) {
      var jsonString = JSON.stringify(result);
      XmlModel.jsonObject = result;
    });
    this.updateCorrectedXml(this.fileName);
  }


}
function convertCanvasToImage(canvas) {
  console.log("In Tiff Image conversion");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  return image;
}
