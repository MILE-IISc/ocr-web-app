
import { Component, OnInit,Renderer2} from '@angular/core';
declare var $:any;
import { fromEvent, Subscription } from 'rxjs';
import { map, buffer, filter, debounceTime } from 'rxjs/operators';
import * as $ from 'jquery';
import * as JSZip from 'jszip';
// import * as $ from 'jquery';

import { BlockModel} from '../shared/block-model';
declare var $:any
declare var Tiff: any;
import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
import { ViewerService } from '../services/viewer.service';
import { XmlModel,retain } from '../shared/xml-model';
import { AuthService } from '../auth/auth.service';
import * as fileSaver from 'file-saver';
import { FileService } from '../services/file.service';

@Component({
 selector: 'app-screen',
 templateUrl: './screen.component.html',
 styleUrls: ['./screen.component.css'],
})

export class ScreenComponent implements OnInit{

  private waveSub: Subscription;
  serverImages: Images[] = [];
  userName;
  imageList = "";
  displayarea: any;
  isLoading = false;
  title = 'Layout';
  public value: string;
  imagewidth;
  xmlItems;
  words: any = XmlModel.textArray;
  selectedImage: string;
  anotherTryVisible: boolean;
  public localUrl: any;
  public tiffUrl: any;
  isMenuOpen = false;
  xmlFileName;
  url;
  fileName: any;
  localUrlArray: any[] = [];
  files: any[] = []
  nextImage = true;
  previousImages = true;
  loaded = false;
  imgFileCount = 0;
  imgWidth;
  isTiff = false;
  fit: string;
  public percentage = 0;
  public angle = 0;
  btnImgArray: any[] = [];
  display;
  images: Images[];
  ImageIs = true;
  isDiv = false;
  myHeight = ( window.innerHeight-125);

  constructor(private headerService: HeaderService, private imageService: ImageService, private viewerService: ViewerService
    , public authService: AuthService,private fileService:FileService) { }

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    // console.log("user name in screen "+this.userName)
    this.imageService.getServerImages();
    this.percentage = this.headerService.getpercentagevary();
    $("#SaveToXML").hide();
    $("#blockno").hide();
    this.headerService.percentageChange
      .subscribe(
        (percent: number) => {
          this.percentage = percent;
        });

        // retain.percentage = this.percentage;
        // console.log("the current percentage is "+retain.percentage)

    this.isLoading = this.headerService.getloadingvalue();
    this.headerService.loadingvaluechage
      .subscribe(
        (spin: boolean) => {
          this.isLoading = spin;
        });

    this.value = this.headerService.getHeaderValue();
    this.headerService.headerValueChange
      .subscribe(
        (val: string) => {
          this.value = val;
        });

    this.nextImage = this.headerService.getMultipleImage();
    this.headerService.multiImageChange
      .subscribe(
        (multiImage: boolean) => {
          this.nextImage = multiImage;
        });

    this.waveSub = this.imageService
      .getWaveUpdateListener()
      .subscribe(async (imageData: { serverImages: Images[] }) => {
        // console.log("inside subscribe in screen oninit")
        this.serverImages = imageData.serverImages;
        // this.isLoading = true;
        const imageLength = this.serverImages.length;
        // console.log("imageLength in screen onInit "+imageLength)
        if (imageLength > 0) {
          if (this.isDiv == true) {
            // console.log("holder is there");
            $('.holderClass').remove();
          }
          this.isLoading = true;
          this.ImageIs = true;
          this.nextImage = false;
          this.imageService.nextImageChange.emit(this.nextImage);
          this.isLoading = false;
          // this.fileName = " The files alloted for you ";

          this.localUrl = await this.imageService.loadArray(this.serverImages[0].imagePath);
          this.imageService.urlChanged.emit(this.localUrl.slice());
          this.fileName = this.serverImages[0].fileName;
          setTimeout(() => this.viewerService.fitwidth(), 50);
          setTimeout(() => this.setpercentage(), 60);

        }
        else {
          this.ImageIs = false;
          this.fileName = "No files have been Uploaded";
        }
      });

    this.imageService.displayChange.subscribe((display: any) => {
      this.display = display;
    });

    this.imageService.urlChanged
      .subscribe(
        (url: any) => {
          // console.log("Inside subscribe");
          // console.log("+++++++++url: " + url);
          this.localUrl = url;
        });

    this.imageService.fileNameChange.subscribe((fileName: any) => {
      // console.log("nextImages inside footer: " + fileName);
      this.fileName = fileName;
    });

    var element = document.getElementById("content");
    // console.log("documents----" + element)
    this.imageService.setDocumentId(element);
  }

  async openThisImage(event) {
    // console.log("inside open this image");
    var id = event.target.value;
    // console.log("id : " + id);
    this.images = this.imageService.getImages();
    for (let i = 0; i < this.images.length; i++) {
      if (this.images[i].fileName == id) {
        this.localUrl = await this.imageService.loadArray(this.images[i].imagePath);
        this.fileName = this.images[i].fileName;
        this.imageService.imgFileCount = i;
        this.imageService.imageCountChange.emit(this.imgFileCount);
        console.log("imgFileCount "+this.imgFileCount);
      }
    }
    this.closeModalDialog();
  }

  closeModalDialog() {
    this.display = 'none'; //set none css after close dialog
  }

  importFile(event) {
    this.anotherTryVisible = true;
    var fileRead = (event.target as HTMLInputElement).files;
    var filesCount = event.target.files.length;
    // console.log("isLoading before calling importFile: " + this.isLoading);
    this.isLoading = true;
    // console.log("isLoading after calling importFile: " + this.isLoading);
    if (event.target.files && fileRead) {
      this.imageService.addImage(fileRead);
    }
    setTimeout(() => this.fitwidth(), 50);
    setTimeout(() => this.setpercentage(), 60);
  }


  onEnter(value: number) {
    this.angle = value;
    this.viewerService.angle = this.angle;
    this.viewerService.onEnter();
  }

  onZoom(value: number) {
    this.percentage = value;
    this.viewerService.percentage = this.percentage;
    this.viewerService.onZoom();
  }

  asVertical() {
    this.viewerService.asVertical();
    this.value = this.viewerService.value;
    // this.viewerService.asVertical();
    // console.log("asVertical has been invoked from screen");
    setTimeout(() => this.setpercentage(), 50);
  }

  asHorizontal() {
    this.viewerService.asHorizontal();
    this.value = this.viewerService.value;
    // this.viewerService.asHorizontal();
    this.headerService.setpercentagevary(this.percentage);
    setTimeout(() => this.setpercentage(), 50);
  }

  setpercentage() {
    this.percentage = this.viewerService.getpercentage();
    this.headerService.setpercentagevary(this.percentage);
  }

  fitheight() {
    this.viewerService.fitheight();
    this.percentage = this.viewerService.percentage;
  }

  fitwidth() {
    this.viewerService.fitwidth();
    this.percentage = this.viewerService.percentage;
  }

  zoomInFun() {
    this.viewerService.zoomInFun();
  }

  zoomOutFun() {
    this.viewerService.zoomOutFun();
  }

  rotateImage() {
    this.viewerService.rotateImage();
  }

  rotateImageanti() {
    this.viewerService.rotateImageanti();
  }

  imgSize() {
    var myImg;
    myImg = document.getElementById("imgToRead");
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    alert("Original width=" + realWidth + ", " + "Original height=" + realHeight);
  }

  orginalsize() {
    this.viewerService.orginalsize();
    this.percentage = this.viewerService.percentage;
  }

  updateScroll(scrollOne: HTMLElement, scrollTwo: HTMLElement) {
    // do logic and set
    scrollTwo.scrollLeft = scrollOne.scrollLeft;
    scrollTwo.scrollTop = scrollOne.scrollTop;
  }

  updatescroll(scrollOne: HTMLElement, scrollTwo: HTMLElement) {
    scrollOne.scrollLeft = scrollTwo.scrollLeft;
    scrollOne.scrollTop = scrollTwo.scrollTop;
  }

  selectBlock() {
    console.log("inside script");
    this.isDiv = true;
    this.viewerService. selectBlockservice();
    this.imageService.onXml();

    $('#nextImg').click(function () {
      // console.log("onclick");
      $('#imgToRead').selectAreas('reset');
    });
    $('#previousImg').click(function () {
      $('#imgToRead').selectAreas('reset');
    });
    $('#firstImg').click(function () {
      $('#imgToRead').selectAreas('reset');
    });
    $('#lastImg').click(function () {
      $('#imgToRead').selectAreas('reset');
    });
  // });
  }

  onSave() {
    var areas = $('img#imgToRead').selectAreas('areas');
    // console.log("area length" + areas.length);
    var prolog = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    var xmlDocument = document.implementation.createDocument('http://mile.ee.iisc.ernet.in/schemas/ocr_output', "page", null);
    for (let i = 0; i < areas.length; i++) {
      // console.log("percentage" + this.percentage);
      var blockElem = xmlDocument.createElement("block");
      blockElem.setAttribute("type", "Text");
      var blockNumberElems = $(".select-areas-blockNumber-area");
      console.log("-----blockNumberElems------" + blockNumberElems.length);
      var blockNumber = document.getElementsByClassName('select-areas-blockNumber-area');
      console.log("block number" + blockNumber[(blockNumberElems.length - 1) - i].innerHTML)
      blockElem.setAttribute("BlockNumber", blockNumber[(blockNumberElems.length - 1) - i].innerHTML);
      blockElem.setAttribute("SubType", "paragraphProse");
      var y = ((areas[i].y * 100) / this.percentage).toString();
      console.log("row start" + y);
      blockElem.setAttribute("rowStart", y);
      var height = ((areas[i].height * 100) / this.percentage)
      var rowEnd = (height + parseFloat(y)).toString();
      blockElem.setAttribute("rowEnd", rowEnd);
      var x = ((areas[i].x * 100) / this.percentage).toString();
      blockElem.setAttribute("colStart", x);
      var width = ((areas[i].width * 100) / this.percentage)
      var colEnd = (width + parseFloat(x)).toString();
      blockElem.setAttribute("colEnd", colEnd);
      // pageElem.appendChild(blockElem);
      xmlDocument.documentElement.appendChild(blockElem);
    }
    var xmlString = prolog + new XMLSerializer().serializeToString(xmlDocument);
    console.log("xml----" + xmlString);
    this.imageService.updateXml(xmlString, this.fileName);
  }

  async onSaveXml() {
    console.log("in export")
    this.images = this.imageService.getImages();
    console.log("image length in export " + this.images.length);
    var folderName = this.fileName.slice(0, -9)
    var zip = new JSZip();
    let count = 0;
    var folder = zip.folder(folderName);
    for (let i = 0; i < this.images.length; i++) {
      console.log("in export completed " + this.images[i].completed);
      if (this.images[i].completed == "Y") {
        var curImagePath = this.images[i].imagePath;
        var curXmlFileName = curImagePath.slice(0, -3) + 'xml';
        console.log("curXmlFileName " + curXmlFileName);
        await this.fileService.downloadFile(curXmlFileName).then(response => {
          let blob: any = new Blob([response], { type: 'text/xml' });
          folder.file(this.images[i].fileName.slice(0, -3) + 'xml', blob);
        }), error => {
          console.log("error: " + error);
          alert(error);
        };
      }
      count++;
      if (count === this.images.length - 1) {
        zip.generateAsync({ type: "blob" })
          .then(function (content) {
            fileSaver.saveAs(content, folderName);
          });
      }
    }
  }

  openMenu(event) {
    this.isMenuOpen = true;
    event.preventDefault();
    $("#menu").css("display", "block");
    $("#menu").css("left", event.clientX+"px");
    $("#menu").css("top", event.clientY+"px");
    }
    closeMenu() {
      // if(this.isMenuOpen == true) {
        // this.isMenuOpen = false;
        $("#menu").css("display", "none");
      }
      alertSize() {
        var myWidth = 0, myHeight = 0;
        if( typeof( window.innerWidth ) == 'number' ) {
          //Non-IE
          myWidth = window.innerWidth;
          myHeight = window.innerHeight;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
          //IE 6+ in 'standards compliant mode'
          myWidth = document.documentElement.clientWidth;
          myHeight = document.documentElement.clientHeight;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
          //IE 4 compatible
          myWidth = document.body.clientWidth;
          myHeight = document.body.clientHeight;
        }
        window.alert( 'Width = ' + myWidth );
        window.alert( 'Height = ' + myHeight );
      }
      blockupdate(){
        this.viewerService.blocknumberupdate()

      }


}

