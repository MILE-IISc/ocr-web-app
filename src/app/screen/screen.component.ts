
import { Component, HostListener, OnInit,Renderer2} from '@angular/core';
declare var $:any;
import { fromEvent, Subscription } from 'rxjs';
import { map, buffer, filter, debounceTime } from 'rxjs/operators';
import * as $ from 'jquery';
import * as JSZip from 'jszip';
// import * as $ from 'jquery';
import * as xml2js from 'xml2js';
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
import { MatIconRegistry } from "@angular/material/icon";

@Component({
 selector: 'app-screen',
 templateUrl: './screen.component.html',
 styleUrls: ['./screen.component.css'],
})

export class ScreenComponent implements OnInit{
  opened: boolean;
  events: string[] = [];
  private waveSub: Subscription;
  serverImages: Images[] = [];
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
  display="none";
  images: Images[];
  ImageIs = true;
  isDiv = false;
  myHeight = (window.innerHeight-30);
  userName: string;
  userIsAuthenticated = false;
  isAdmin;
  private authListenerSubs: Subscription;
  clientpercent;
  nextImages = true;
  divelement = true;
  urlOcr;
  JsonObj;
  sidesize1 = 0;
  sidesize2 = 100;
  area1 = 50;
  area2 = 50;
  size3 = 50;
  Isopen = true;
  invalidMessage ="";

  sideOpen() {
    if (this.Isopen == true) {
      this.sidesize1 = 50;
      this.sidesize2 = 50;
      this.size3 = 35;
      this.serverImages = this.imageService.getImages();
      this.images = this.imageService.getLocalImages();
      if (this.serverImages.length > 0) {
        this.imageService.openModalDialog(this.serverImages);
      } else {
        this.imageService.openModalDialog(this.images);
      }
      this.Isopen = false;
    }
    else {
      this.sidesize1 = 0;
      this.sidesize2 = 100;
      this.size3 = 50
      this.Isopen = true;
    }
  }

  sideClose() {
    this.sidesize1 = 0;
    this.sidesize2 = 100;
    this.size3 = 50
  }

  constructor(private headerService: HeaderService, private imageService: ImageService, private viewerService: ViewerService,
    public authService: AuthService, private fileService: FileService) { }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.authListenerSubs.unsubscribe();
  }


  ngOnInit(): void {
    // authentication related
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.userName = this.authService.getUserName();
    this.isAdmin = this.authService.getIsAdmin();
    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userName = this.authService.getUserName();
        this.isAdmin = this.authService.getIsAdmin();
      });


    this.userName = this.authService.getUserName();
    this.imageService.getServerImages().then(() => {
      console.log("got serverImages in screen ngOnInit");
    });
    this.percentage = this.headerService.getpercentagevary();
    $("#SaveToXML").hide();
    $("#blockno").hide();
    this.headerService.percentageChange
      .subscribe(
        (percent: number) => {
          this.percentage = percent;
        });

    retain.percentage = this.percentage;

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

    this.imageService.invalidMessageChange
      .subscribe(
        (invalidMessage: string) => {
          console.log("invalid mes in screen======== " + invalidMessage);
          this.invalidMessage = invalidMessage;
          if (this.invalidMessage != "") {
            var x = document.getElementById("snackbar");
            console.log("x in screen " + x);
            if (x != null) {
              x.className = "show";
              setTimeout(() => {
                x.className = x.className.replace("show", "");
              }, 5000);
            }
          }
        });

    this.waveSub = this.imageService
      .getImageUpdateListener()
      .subscribe(async (imageData: { serverImages: Images[] }) => {
        this.serverImages = imageData.serverImages;
        const imageLength = this.serverImages.length;
        if (imageLength > 0) {
          if (this.isDiv == true) {
            $('.holderClass').remove();
          }
          this.isLoading = true;
          this.ImageIs = true;
          this.nextImage = false;
          this.imageService.nextImageChange.emit(this.nextImage);
          this.isLoading = false;
          // this.fileName = " The files alloted for you ";
          console.log("this.serverImages[0].fileName: ------------_> ", this.serverImages[0].fileName);
          this.localUrl = await this.imageService.loadArray(this.serverImages[0].fileName);
          // this.imageService.urlChanged.emit(this.localUrl.slice());
          this.fileName = this.serverImages[0].fileName;
          setTimeout(() => this.viewerService.fitwidth(), 50);
          setTimeout(() => this.setpercentage(), 60);
        }
        else {
          this.ImageIs = false;
          this.fileName = "No files have been Uploaded";
        }
      });

    this.imageService.imagesModified.subscribe((images: Images[]) => {
      console.log("inside service subscribe....");
      console.log("inside foooor");
      this.isLoading = true;
      if (images.length > 0) {
        this.localUrl = images[0].dataUrl;
        this.fileName = images[0].fileName;
        this.isLoading = false;

        this.ImageIs = true;
        setTimeout(() => this.viewerService.fitwidth(), 50);
        setTimeout(() => this.setpercentage(), 60);
      }
      else {
        this.ImageIs = false;
      }
    });

    this.imageService.displayChange.subscribe((display: any) => {
      this.display = display;
    });

    this.imageService.urlChanged
      .subscribe(
        (url: any) => {
          this.localUrl = url;
          setTimeout(() => this.viewerService.fitwidth(), 50);
          setTimeout(() => this.setpercentage(), 60);
        });

    this.imageService.fileNameChange.subscribe((fileName: any) => {
      this.fileName = fileName;
    });

    var element = document.getElementById("content");
    this.imageService.setDocumentId(element);

    console.log("this.headerService.getpercentagevary()", this.headerService.getpercentagevary());
    this.percentage = this.headerService.getpercentagevary();
    this.headerService.percentageChange
      .subscribe(
        (percent: number) => {
          this.percentage = percent;
          console.log("percent inside footeroninit on headerpercentacgehange", percent);
        }
      );

    this.imageService.nextImageChange.subscribe((nextImages: boolean) => {
      console.log("nextImages inside footer: " + nextImages);
      this.nextImages = nextImages;
    });

    this.imageService.previousImageChange.subscribe((previousImages: boolean) => {
      console.log("nextImages inside footer: " + previousImages);
      this.previousImages = previousImages;
    });
  }

  async openThisImage(event) {
    var id = event.target.value;
    this.images = this.imageService.getImages();
    for (let i = 0; i < this.images.length; i++) {
      if (this.images[i].fileName == id) {
        this.localUrl = await this.imageService.loadArray(this.images[i].fileName);
        this.fileName = this.images[i].fileName;
        this.imageService.imgFileCount = i;
        this.imageService.imageCountChange.emit(this.imgFileCount);
        console.log("imgFileCount " + this.imgFileCount);
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
    this.isLoading = true;
    if (event.target.files && fileRead) {
      this.imageService.addImage(fileRead);
    }
    setTimeout(() => this.fitwidth(), 50);
    setTimeout(() => this.setpercentage(), 60);
  }

  asVertical() {
    this.viewerService.asVertical();
    this.value = this.viewerService.value;
    setTimeout(() => this.setpercentage(), 50);
  }

  asHorizontal() {
    this.viewerService.asHorizontal();
    this.value = this.viewerService.value;
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
    console.log("this.percentage before header in fitheight",this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    console.log("this.percentage after header in fitheight",this.percentage);
  }

  fitwidth() {
    this.viewerService.fitwidth()
    this.percentage = this.viewerService.percentage;
    console.log("this.percentage before header in fitwidth",this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    console.log("this.percentage after header in fitwidth",this.percentage);
  }

  zoomInFun() {
    this.viewerService.zoomInFun();
    this.percentage = this.viewerService.percentage;
    this.headerService.setpercentagevary(this.percentage);
  }

  zoomOutFun() {
    this.viewerService.zoomOutFun();
    this.percentage = this.viewerService.percentage;
    this.headerService.setpercentagevary(this.percentage);
  }

  rotateImage() {
    this.viewerService.rotateImage();
    this.angle = this.viewerService.angle;
  }

  rotateImageanti() {
    this.viewerService.rotateImageanti();
    this.angle = this.viewerService.angle;
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
    console.log("this.percentage before header in orginalsize",this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    console.log("this.percentage after header in orginalsize",this.percentage);
  }

  onEnter(value: number) {
    this.clientpercent = this.percentage;
    this.angle = value;
    this.viewerService.angle = this.angle;
    this.viewerService.onEnter();
  }

  onZoom(value: number) {
    this.clientpercent = this.percentage;
    this.percentage = value;
    this.viewerService.percentage = this.percentage;
    this.viewerService.onZoom();
    this.headerService.setpercentagevary(this.percentage);
    this.blocksize()
  }


  NextImage() {
    this.onEnter(0);
    this.imageService.nextPage();
    this.imageService.onXml();
 }

  previousImage() {
    this.onEnter(0);
    this.imageService.previousPage();
    this.imageService.onXml();
  }

  lastImage() {
    this.onEnter(0);
    this.imageService.LastImage();
    this.imageService.onXml();
  }

  firstImage() {
    this.onEnter(0);
    this.imageService.firstImage();
    this.imageService.onXml();
  }
  skipPage() {
    //this.localUrl = this.localUrlArray[this.imgFileCount];
  }

  loadXMLDoc() {
    this.serverImages = this.imageService.getImages();
    if(this.serverImages.length>0){
      this.fileName = this.serverImages[this.imageService.imgFileCount].fileName;
      this.imageService.getXmlFileAsJson(this.fileName);
    }else{
      this.images = this.imageService.getLocalImages();
      this.fileName = this.images[this.imageService.imgFileCount].fileName;
      this.imageService.getXmlFileAsJson(this.fileName);
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
        setTimeout(() => this.viewerService.selectBlockservice(), .001);
      }
    }
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
    var prolog = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    var xmlDocument = document.implementation.createDocument('http://mile.ee.iisc.ernet.in/schemas/ocr_output', "page", null);
    for (let i = 0; i < areas.length; i++) {
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
      xmlDocument.documentElement.appendChild(blockElem);
    }
    var xmlString = prolog + new XMLSerializer().serializeToString(xmlDocument);

    xml2js.parseString(xmlString, { mergeAttrs: true }, function (err, result) {
      var jsonString = JSON.stringify(result)
      XmlModel.jsonObject = result;
      console.log("xml.js result as JSON " + jsonString);
    });
    this.imageService.updateCorrectedXml(this.fileName);
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
        var curFileName = this.images[i].fileName;
        var curXmlFileName = curFileName.slice(0, -3) + 'xml';
        console.log("curXmlFileName " + curXmlFileName);
        //changes have to be made in file service to get the xml file from backend
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

      showTooltip() {
        console.log("inside show tool tip on save");
        this.correctionUpdate();
      }

  correctionUpdate() {
    var texts = document.getElementsByClassName('text_input');
    console.log("texts length " + texts.length);
    for (var l = 0; l < texts.length; l++) {
      var blocks = XmlModel.jsonObject['page'].block;
      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].line) {
          var lines = blocks[i].line;
          for (var j = 0; j < lines.length; j++) {
            if (lines[j].word) {
              var words = lines[j].word;
              if (lines[j].LineNumber == texts[l].getAttribute("id")) {
                console.log((texts[l] as HTMLInputElement).value);
                var text = (texts[l] as HTMLInputElement).value;
                if (words.length > 1) {
                  console.log("word array length " + words.length)
                  var textArray = text.split(/(\s+)/).filter(function (e) { return e.trim().length > 0; });
                  console.log("text array length " + textArray.length)
                  if (words.length == textArray.length) {
                    for (let k = 0; k < words.length; k++) {
                      words[k].unicode = textArray[k].trim();
                    }
                  } else if (textArray.length > words.length || textArray.length < words.length) {
                    console.log("in text array greater ");
                    var txt = "";
                    for (let m = 0; m < textArray.length; m++) {
                      txt = txt + " " + textArray[m];
                    }
                    words[0].unicode = txt.trim();
                    words[0].colEnd = words[words.length - 1].colEnd;
                    console.log("word[0] " + words[0].unicode);
                    console.log("word[1] " + words[1].unicode);
                    for (let n = 1; n < words.length; n++) {
                      console.log("words.length", words.length, "n", n, "lines inndex", j)
                      words[n].unicode = "";
                    }
                  }
                } else {
                  console.log("in else block of update");
                  words[0].unicode = text.trim();
                }
              }
            }
          }
        }
      }
    }
    // console.log("final json  "+JSON.stringify(XmlModel.jsonObject));
    this.imageService.updateCorrectedXml(this.fileName);
  }
}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image.src: " + image.src);
  return image;
}

