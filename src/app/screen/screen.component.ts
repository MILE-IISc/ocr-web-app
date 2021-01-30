import { Component, HostListener, OnInit, Renderer2,ViewEncapsulation } from '@angular/core';
declare var $: any;
import { fromEvent, Subscription } from 'rxjs';
import { map, buffer, filter, debounceTime } from 'rxjs/operators';
import * as $ from 'jquery';
import * as JSZip from 'jszip';
// import * as $ from 'jquery';
import * as xml2js from 'xml2js';
import { BlockModel } from '../shared/block-model';
declare var $: any
declare var Tiff: any;
import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
// import { ViewerService } from '../services/viewer.service';
import { XmlModel, retain } from '../shared/xml-model';
import { AuthService } from '../auth/auth.service';
import * as fileSaver from 'file-saver';
import { FileService } from '../services/file.service';
import { MatIconRegistry } from "@angular/material/icon";
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css'],
})

export class ScreenComponent implements OnInit {
  opened: boolean;
  events: string[] = [];
  private waveSub: Subscription;
  localImages: Images[] = [];
  imageList = "";
  displayarea: any;
  isLoading = false;
  isRunningOcr = false;
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
  display = "none";
  images: Images[];
  ImageIs = true;
  isDiv = false;
  myHeight = (window.innerHeight - 55.5);
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
  invalidMessage = "";
  callOne = true;
  obtainblock = false;
  ocrMessage = "";
  isLoadingfromServer = false;
  isDownloading = false;

  sideOpen() {
    this.sidesize1 = 30;
    this.sidesize2 = 70;
    this.localImages = this.imageService.getLocalImages();
    this.imageService.openModalDialog(this.localImages);

    $("#OpenBar").hide();
    $("#CloseBar").show();
  }

  sideClose() {
    this.sidesize1 = 0;
    this.sidesize2 = 100;
    this.size3 = 50
    $("#OpenBar").show();
    $("#CloseBar").hide();
  }

  constructor(private headerService: HeaderService, private imageService: ImageService,
    public authService: AuthService, private fileService: FileService,public dialog: MatDialog) { }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.authListenerSubs.unsubscribe();
  }

  openDialog() {
    const dialogRef = this.dialog.open(ScreenComponentDialog, {
      disableClose: true,
      width: '450px',
      panelClass: 'my-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  ngOnInit(): void {
    $("#CloseBar").hide();
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
    this.isLoadingfromServer = true;

    this.imageService.getServerImages().then(() => {
      console.log("Getting server images on Init");

    });

    this.imageService.isLoadingFromServerChange.subscribe((isLoadingFromServer) => {
      this.isLoadingfromServer = isLoadingFromServer;
    });

    this.percentage = this.headerService.getpercentagevary();
    $("#SaveToXML").hide();
    $("#btUpdateBlockNumbers").hide();
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
          this.isLoadingfromServer = spin;
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

    this.imageService.ocrMessageChange
      .subscribe(
        (ocrMessage: string) => {
          this.ocrMessage = ocrMessage;
          if (this.ocrMessage != "" || this.ocrMessage != null) {
            console.log("ocr message in screen " + this.ocrMessage);
            var elem = document.getElementById("footerSnackBar");
            if (elem != null) {
              elem.className = "show";
              setTimeout(() => {
                elem.className = elem.className.replace("show", "");
              }, 5000);
            }
          }
        });

    this.waveSub = this.imageService
      .getImageUpdateListener()
      .subscribe(async (imageData: { localImages: Images[] }) => {
        this.localImages = imageData.localImages;
        const imageLength = this.localImages.length;
        if (imageLength > 0) {
          if (this.isDiv == true) {
            $('.holderClass').remove();
          }
          this.isLoading = true;
          this.ImageIs = true;
          if (imageLength > 1) {
            this.nextImage = false;
            this.imageService.nextImageChange.emit(this.nextImage);
          }
          this.isLoading = false;
          this.isLoadingfromServer = false;
          console.log("this.localImages[0].fileName: ------------_> ", this.localImages[0].fileName);
          if (this.localImages[0].dataUrl == "" || this.localImages[0].dataUrl == null) {
            this.localImages[0].dataUrl = await this.imageService.loadArray(this.localImages[0].fileName);
          }
          this.localUrl = this.localImages[0].dataUrl;
          this.fileName = this.localImages[0].fileName;
          setTimeout(() => this.imageService.fitwidth(), 50);
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
          this.localUrl = url;
          setTimeout(() => this.imageService.screenview(), 50);
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

    this.imageService.isRunningOcrChange.subscribe((isRunningOcr: boolean) => {
      console.log("isRunning ocr in screen " + isRunningOcr);
      this.isRunningOcr = isRunningOcr;
    });
  }

  async openThisImage(event) {
    var id = event.target.value;
    this.localImages = this.imageService.getLocalImages();
    $('img#imgToRead').selectAreas('destroy');
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    for (let i = 0; i < this.localImages.length; i++) {
      if (this.localImages[i].fileName == id) {
        console.log("this.localImages[" + i + "].fileName", this.localImages[i].fileName, "dataUrl", this.localImages[i].dataUrl);
        if (this.localImages[i].dataUrl == null || this.localImages[i].dataUrl == "") {
          this.localImages[i].dataUrl = await this.imageService.loadArray(this.localImages[i].fileName);
        }
        this.localUrl = this.localImages[i].dataUrl;
        this.fileName = this.localImages[i].fileName;
        this.imageService.imgFileCount = i;
        this.imageService.imageCountChange.emit(this.imgFileCount);
        console.log("imgFileCount " + this.imgFileCount);
      }

    }
    this.imageService.buttonenable();
    this.imageService.onXml();
    setTimeout(() => this.imageService.screenview(), 50);
    setTimeout(() => this.setpercentage(), 60);
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
    this.imageService.asVertical();
    this.value = this.imageService.value;
    setTimeout(() => this.setpercentage(), 50);
  }

  asHorizontal() {
    this.imageService.asHorizontal();
    this.value = this.imageService.value;
    this.headerService.setpercentagevary(this.percentage);
    setTimeout(() => this.setpercentage(), 50);
  }

  setpercentage() {
    this.percentage = this.imageService.getpercentage();
    this.headerService.setpercentagevary(this.percentage);
  }

  fitwidth() {
    this.imageService.fitwidth()
    this.percentage = this.imageService.percentage;
    console.log("this.percentage before header in fitwidth", this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    console.log("this.percentage after header in fitwidth", this.percentage);
  }

  imgSize() {
    var myImg;
    myImg = document.getElementById("imgToRead");
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    alert("Original width=" + realWidth + ", " + "Original height=" + realHeight);
  }

  orginalsize() {
    this.imageService.orginalsize();
    this.percentage = this.imageService.percentage;
    console.log("this.percentage before header in orginalsize", this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    console.log("this.percentage after header in orginalsize", this.percentage);
  }

  loadXMLDoc() {
    this.localImages = this.imageService.getLocalImages();
    if (this.localImages.length > 0) {
      this.fileName = this.localImages[this.imageService.imgFileCount].fileName;
      this.imageService.getXmlFileAsJson(this.fileName);
    } else {
      this.localImages = this.imageService.getLocalImages();
      this.fileName = this.localImages[this.imageService.imgFileCount].fileName;
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
        setTimeout(() => this.imageService.selectBlockservice(), .001);
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
    $("#blockselect").css("background-color", "hsl(210, 100%, 20%)");
    this.obtainblock = true;
    console.log("inside script");
    this.isDiv = true;
    this.imageService.selectBlockservice();
    this.imageService.onXml();



    $('.sidebody').click(function () {
      $('#imgToRead').selectAreas('reset');
    });

  }






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
    this.imageService.updateCorrectedXml(this.fileName);
  }

  correctionUpdate() {
    console.log("in ocr correction")
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
              if (lines[j]["$"].LineNumber == texts[l].getAttribute("id")) {
                console.log((texts[l] as HTMLInputElement).value);
                var text = (texts[l] as HTMLInputElement).value;
                if (words.length > 1) {
                  console.log("word array length " + words.length)
                  var textArray = text.split(/(\s+)/).filter(function (e) { return e.trim().length > 0; });
                  console.log("text array length " + textArray.length)
                  if (words.length == textArray.length) {
                    for (let k = 0; k < words.length; k++) {
                      words[k]["$"].unicode = textArray[k].trim();
                    }
                  } else if (textArray.length > words.length || textArray.length < words.length) {
                    console.log("in text array greater ");
                    var txt = "";
                    for (let m = 0; m < textArray.length; m++) {
                      txt = txt + " " + textArray[m];
                    }
                    words[0]["$"].unicode = txt.trim();
                    words[0]["$"].colEnd = words[words.length - 1].colEnd;
                    console.log("word[0] " + words[0]["$"].unicode);
                    console.log("word[1] " + words[1]["$"].unicode);
                    for (let n = 1; n < words.length; n++) {
                      console.log("words.length", words.length, "n", n, "lines inndex", j)
                      words[n]["$"].unicode = "";
                    }
                  }
                } else {
                  console.log("in else block of update");
                  words[0]["$"].unicode = text.trim();
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

  async downloadXml() {
    console.log("in export")
    this.localImages = this.imageService.getLocalImages();
    console.log("image length in export " + this.localImages.length);
    // var folderName = this.fileName.slice(0, -9);
    var folderName = "XML_Files";
    console.log("folder Name", folderName);
    var zip = new JSZip();
    let count = 0;
    var folder = zip.folder(folderName);
    for (let i = 0; i < this.localImages.length; i++) {
      console.log("in export completed " + this.localImages[i].completed);
      if (this.localImages[i].completed == "Y") {
        var curFileName = this.localImages[i].fileName;
        var curXmlFileName = curFileName.slice(0, -3) + 'xml';
        console.log("curXmlFileName " + curXmlFileName);
        //changes have to be made in file service to get the xml file from backend
        await this.fileService.downloadFile(curXmlFileName).then(response => {
          console.log("xml content while downloading", response.xmlData);
          let blob: any = new Blob([response.xmlData], { type: 'text/xml' });
          console.log("blob===" + blob);
          console.log("this.localImages[i].fileName.slice(0, -3) + 'xml'", this.localImages[i].fileName.slice(0, -3) + 'xml');
          folder.file(this.localImages[i].fileName.slice(0, -3) + 'xml', blob);
        }), error => {
          console.log("error: " + error);
          alert(error);
        };
      }
      count++;
      console.log("count before if of onSave", count);
      if (count === this.localImages.length) {
        console.log("count inside if of onSave", count);
        zip.generateAsync({ type: "blob" })
          .then(function (content) {
            fileSaver(content, folderName);
          });
      }
    }
  }

  async downloadXml2() {
    this.isDownloading = true;
    await this.fileService.downloadZipFile().then(response => {
      this.isDownloading = false;
      fileSaver(response, "OCR_output.zip");
    }), error => {
      console.log("Error while getting ZIP of XML files from server: " + error);
      alert(error);
    };
  }

  openMenu(event) {
    this.isMenuOpen = true;
    event.preventDefault();
    $("#menu").css("display", "block");
    $("#menu").css("left", event.clientX + "px");
    $("#menu").css("top", event.clientY + "px");
  }
  closeMenu() {
    $("#menu").css("display", "none");
  }
  alertSize() {
    var myWidth = 0, myHeight = 0;
    if (typeof (window.innerWidth) == 'number') {
      //Non-IE
      myWidth = window.innerWidth;
      myHeight = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
      //IE 6+ in 'standards compliant mode'
      myWidth = document.documentElement.clientWidth;
      myHeight = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
      //IE 4 compatible
      myWidth = document.body.clientWidth;
      myHeight = document.body.clientHeight;
    }
    window.alert('Width = ' + myWidth);
    window.alert('Height = ' + myHeight);
  }

  blockupdate() {
    this.imageService.blocknumberupdate()
  }

  showTooltip() {
    console.log("inside show tol tip");
    this.correctionUpdate();
  }

  xmlonSave() {
    console.log("inside xmlOnSave");
    this.onSave();
  }

  unselectBlock() {
    $("#blockselect").css("background-color", "initial");
    this.obtainblock = false;
    this.imageService.unselectBlock();

  };

  call() {
    if (this.callOne) this.selectBlock();
    else this.unselectBlock();
    this.callOne = !this.callOne;
  };

  // openDialog() {
  //   const dialogRef = this.dialog.open(ScreenComponentDialog);

  //   dialogRef.afterClosed().subscribe(result => {
  //     console.log(`Dialog result: ${result}`);
  //   });
  // }

}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image.src: " + image.src);
  return image;
}

@Component({
  selector: 'app-screen-Dialog',
  templateUrl: './screen.component.dialog.html',
  styleUrls: ['./screen.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class ScreenComponentDialog {
  constructor(private imageService: ImageService){}

  deleteblocks() {
    $('#imgToRead').selectAreas('reset');
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    this.imageService.onSave();
}

}

