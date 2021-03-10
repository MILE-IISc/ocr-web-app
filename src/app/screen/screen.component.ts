import { Component, HostListener, OnInit, Renderer2, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { ThemePalette } from "@angular/material/core";
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css'],
})

export class ScreenComponent implements OnInit {
  opened: boolean;
  events: string[] = [];
  // private waveSub: Subscription;
  // localImages: Images[] = [];
  private imageSub: Subscription;
  pouchImages: any = [];
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
  savemessage;
  filesToBeUploaded;
  bookName;

  sideOpen() {
    this.sidesize1 = 30;
    this.sidesize2 = 70;
    this.imageService.openFileName();
    $('.viewBtn1').css("border","solid 1px black");
    $('.viewBtn2').css("border","none");
    $('.viewBtn1').click(function () {
      $('.viewBtn1').css("border","solid 1px black");
      $('.viewBtn2').css("border","none");
    });
    $('.viewBtn2').click(function () {
      $('.viewBtn2').css("border","solid 1px black");
      $('.viewBtn1').css("border","none");
    });

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

  openfileName(){
    this.imageService.openFileName();
  }

  openPreview(){
    this.imageService.openPreview();
  }

  constructor(private headerService: HeaderService, private imageService: ImageService, private changeDetection: ChangeDetectorRef, private router: Router,
    public authService: AuthService, private fileService: FileService, public dialog: MatDialog, private route: ActivatedRoute) { }

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

  openDeleteDialog() {
    const dialogRef = this.dialog.open(ScreenComponentDeleteImage, {
      disableClose: true,
      width: '450px',
      height: '450px',
      panelClass: 'my-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });

  }

  onKeypress(event) {
    console.log("enter")
    this.correctionUpdate();
    console.log("func called")
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

    this.imageService.ResumeUploadEvent.subscribe(() => {
      this.invokeUploadImage();
    });

    this.imageService.xmlUpdateChange.subscribe((status) => {
      this.changeDetection.detectChanges();
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

    this.savemessage = this.headerService.getloadmessage();
    this.headerService.messageemit
      .subscribe(
        (message: string) => {
          this.savemessage = message;
          if (this.savemessage != "") {
            var x = document.getElementById("updatemessage");
            console.log("x in screen " + x);
            if (x != null) {
              x.className = "show";
              setTimeout(() => {
                x.className = x.className.replace("show", "");
              }, 2000);
            }
          }
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
              }, 2000);
            }
          }
        });

    this.imageService.ocrMessageChange.subscribe((ocrMessage: string) => {
      this.ocrMessage = ocrMessage;
      if (this.ocrMessage != "" || this.ocrMessage != null) {
        console.log("ocr message in screen " + this.ocrMessage);
        var elem = document.getElementById("footerSnackBar");
        if (elem != null) {
          elem.className = "show";
          setTimeout(() => {
            elem.className = elem.className.replace("show", "");
          }, 2000);
        }
      }
    });

    this.imageSub = this.imageService.getPouchImageUpdateListener().subscribe(async (pouchImagesList: {pouchImagesList: []}) => {
      this.pouchImages = pouchImagesList.pouchImagesList;
      console.log("pouchImages.length",this.pouchImages.length);
      if(this.pouchImages.length > 0 ) {
        // for(let i = 0; i < this.pouchImages.length; i++) {
        //   console.log("this.pouchImages["+i+"] data",this.pouchImages[i].pageame);
        // }
        if (this.isDiv == true) {
          $('.holderClass').remove();
        }
        this.isLoading = true;
        this.ImageIs = true;
        if (this.pouchImages.length > 1) {
          this.nextImage = false;
          this.imageService.nextImageChange.emit(this.nextImage);
        }
        this.isLoading = false;
        this.isLoadingfromServer = false;
        this.localUrl = await this.imageService.loadArray(this.pouchImages[0].pageName);
        this.fileName = this.pouchImages[0].pageName;
        setTimeout(() => this.imageService.fitwidth(), 50);
        setTimeout(() => this.setpercentage(), 60);
      } else {
        $(".textElementsDiv").not(':first').remove();
        $(".textSpanDiv").empty();
        this.ImageIs = false;
        this.fileName = "No files have been Uploaded";
        this.localUrl = null;
        this.imageService.buttonEnable();
        this.isLoading = false;
        this.isLoadingfromServer = false;
      }
    });

    // can be removed as its implemented using pouchDb
    // this.waveSub = this.imageService
    //   .getImageUpdateListener()
    //   .subscribe(async (imageData: { localImages: Images[] }) => {
    //     this.localImages = imageData.localImages;
    //     const imageLength = this.localImages.length;
    //     if (imageLength > 0) {
    //       if (this.isDiv == true) {
    //         $('.holderClass').remove();
    //       }
    //       this.isLoading = true;
    //       this.ImageIs = true;
    //       if (imageLength > 1) {
    //         this.nextImage = false;
    //         this.imageService.nextImageChange.emit(this.nextImage);
    //       }
    //       this.isLoading = false;
    //       this.isLoadingfromServer = false;
    //       if (this.localImages[0].dataUrl == "" || this.localImages[0].dataUrl == null) {
    //         this.localImages[0].dataUrl = await this.imageService.loadArray(this.localImages[0].fileName);
    //       }
    //       this.localUrl = this.localImages[0].dataUrl;
    //       this.fileName = this.localImages[0].fileName;
    //       setTimeout(() => this.imageService.fitwidth(), 50);
    //       setTimeout(() => this.setpercentage(), 60);
    //     }
    //     else {
    //       $(".textElementsDiv").not(':first').remove();
    //       $(".textSpanDiv").empty();
    //       this.ImageIs = false;
    //       this.fileName = "No files have been Uploaded";
    //       this.localUrl = null;
    //       this.imageService.buttonEnable()
    //     }
    //   });

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

  goToHomePage() {
    console.log("clicked goToHomePage");
    this.router.navigate(["/booksdashboard"]);
  }

  async openThisImage(event) {
    console.log("event",event.target.id);
    var id = event.target.id;
    $('img#imgToRead').selectAreas('destroy');
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    for (let i = 0; i < this.pouchImages.length; i++) {
      if (this.pouchImages[i].pageName == id) {
        this.localUrl = await this.imageService.loadArray(this.pouchImages[i].pageName);
        this.fileName = this.pouchImages[i].pageName;
        this.imageService.imgFileCount = i;
        this.imageService.imageCountChange.emit(this.imgFileCount);
        console.log("imgFileCount " + this.imgFileCount);
      }

    }

    this.imageService.buttonEnable();
    this.imageService.onXml();
    setTimeout(() => this.imageService.screenview(), 50);
    setTimeout(() => this.setpercentage(), 60);
  }

  importFile(event) {
    this.anotherTryVisible = true;
    this.filesToBeUploaded = (event.target as HTMLInputElement).files;
    var filesCount = event.target.files.length;
    var filesToUpload = event.target.files;
    var relativePath = filesToUpload[0].webkitRelativePath;
    if (event.target.files && this.filesToBeUploaded && filesToUpload.length == 1) {
      var folderName = this.route.snapshot.queryParams['data'];
      this.bookName = folderName;
      this.invokeUploadImage();
    } else if (event.target.files && this.filesToBeUploaded && filesToUpload.length > 1) {
      var folderName = relativePath.split("/");
      this.bookName = folderName[0];
      this.invokeUploadImage();
    }
    this.isLoading = true;
    if (event.target.files && this.filesToBeUploaded) {

    }
    setTimeout(() => this.fitwidth(), 50);
    setTimeout(() => this.setpercentage(), 60);
  }


  invokeUploadImage() {
    this.imageService.addImage(this.filesToBeUploaded, this.bookName, "DISPLAY_IMAGES");
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
    // console.log("this.percentage before header in fitwidth", this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    // console.log("this.percentage after header in fitwidth", this.percentage);
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
    // console.log("this.percentage before header in orginalsize", this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    // console.log("this.percentage after header in orginalsize", this.percentage);
  }

  // can be removed as this function bypassed and unused
  // loadXMLDoc() {
  //   this.localImages = this.imageService.getLocalImages();
  //   if (this.localImages.length > 0) {
  //     this.fileName = this.localImages[this.imageService.imgFileCount].fileName;
  //     this.imageService.getXmlFileAsJson(this.fileName);
  //   } else {
  //     this.localImages = this.imageService.getLocalImages();
  //     this.fileName = this.localImages[this.imageService.imgFileCount].fileName;
  //     this.imageService.getXmlFileAsJson(this.fileName);
  //   }
  // }

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
    this.isDiv = true;
    this.imageService.selectBlockservice();
    this.imageService.onXml();
    $('.sidebody').click(function () {
      $('#imgToRead').selectAreas('reset');
    });

  }

  onSave() {
    this.imageService.onSave();
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
                // console.log((texts[l] as HTMLInputElement).value);
                var text = (texts[l] as HTMLInputElement).value;
                if (words.length > 1) {
                  // console.log("word array length " + words.length);
                  var textArray = text.split(/(\s+)/).filter(function (e) { return e.trim().length > 0; });
                  // console.log("text array length " + textArray.length);
                  if (words.length == textArray.length) {
                    for (let k = 0; k < words.length; k++) {
                      words[k]["$"].unicode = textArray[k].trim();
                    }
                  } else if (textArray.length > words.length || textArray.length < words.length) {
                    // console.log("in text array greater ");
                    var txt = "";
                    for (let m = 0; m < textArray.length; m++) {
                      txt = txt + " " + textArray[m];
                    }
                    words[0]["$"].unicode = txt.trim();
                    words[0]["$"].colEnd = words[words.length - 1].colEnd;
                    // console.log("word[0] " + words[0]["$"].unicode);
                    // console.log("word[1] " + words[1]["$"].unicode);
                    for (let n = 1; n < words.length; n++) {
                      // console.log("words.length", words.length, "n", n, "lines inndex", j);
                      words[n]["$"].unicode = "";
                    }
                  }
                } else {
                  // console.log("in else block of update");
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

  // this can be removed as another function is used for the same purpose
  // async downloadXml() {
  //   console.log("in export")
  //   this.localImages = this.imageService.getLocalImages();
  //   console.log("image length in export " + this.localImages.length);
  //   // var folderName = this.fileName.slice(0, -9);
  //   var folderName = "XML_Files";
  //   console.log("folder Name", folderName);
  //   var zip = new JSZip();
  //   let count = 0;
  //   var folder = zip.folder(folderName);
  //   for (let i = 0; i < this.localImages.length; i++) {
  //     console.log("in export completed " + this.localImages[i].completed);
  //     if (this.localImages[i].completed == "Y") {
  //       var curFileName = this.localImages[i].fileName;
  //       var curXmlFileName = curFileName.slice(0, -3) + 'xml';
  //       console.log("curXmlFileName " + curXmlFileName);
  //       //changes have to be made in file service to get the xml file from backend
  //       await this.fileService.downloadFile(curXmlFileName).then(response => {
  //         console.log("xml content while downloading", response.xmlData);
  //         let blob: any = new Blob([response.xmlData], { type: 'text/xml' });
  //         console.log("blob===" + blob);
  //         console.log("this.localImages[i].fileName.slice(0, -3) + 'xml'", this.localImages[i].fileName.slice(0, -3) + 'xml');
  //         folder.file(this.localImages[i].fileName.slice(0, -3) + 'xml', blob);
  //       }), error => {
  //         console.log("error: " + error);
  //         alert(error);
  //       };
  //     }
  //     count++;
  //     console.log("count before if of onSave", count);
  //     if (count === this.localImages.length) {
  //       console.log("count inside if of onSave", count);
  //       zip.generateAsync({ type: "blob" })
  //         .then(function (content) {
  //           fileSaver(content, folderName);
  //         });
  //     }
  //   }
  // }

  async downloadXml2() {
    this.isDownloading = true;
    let currentBookDb = this.imageService.getCurrentBookDb();
    let bookName = this.route.snapshot.queryParams['data'];
    await this.fileService.downloadZipFile(currentBookDb, bookName).then(response => {
      this.isDownloading = false;
      fileSaver(response, "OCR_output.zip");
    }), error => {
      console.log("Error while getting ZIP of XML files from server: " + error);
      alert(error);
    };
  }


  closeMenu() {
    $("#menu").css("display", "none");
  }


  blockupdate() {
    this.imageService.blocknumberupdate()
  }
  xmlonSave() {
    // console.log("inside xmlOnSave");
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

  openProgressDialog() {
    this.imageService.openProgressDialog();
  }
}

@Component({
  selector: 'app-screen-Dialog',
  templateUrl: './screen.component.dialog.html',
  styleUrls: ['./screen.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class ScreenComponentDialog {
  constructor(private imageService: ImageService) { }

  deleteblocks() {
    $('#imgToRead').selectAreas('reset');
    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    this.imageService.onSave();
  }

}

@Component({
  selector: 'app-screen-DeleteImage',
  templateUrl: './screen.component.deleteimage.html',
  styleUrls: ['./screen.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class ScreenComponentDeleteImage implements OnInit {
  pouchImages = [];
  finalDeletionList = []
  constructor(private imageService: ImageService, public dialog: MatDialog) { }


  image: DeleteImageList = {
    name: "SelectAll",
    completed: false,
    color: "warn",
    deleteImage: []
  };

  image_1: DeleteImageList = {
    name: "SelectAll",
    completed: false,
    color: "warn",
    deleteImage: []
  };

  ngOnInit(): void {
    this.pouchImages = this.imageService.getPouchImagesList();
    for (let i = 0; i < this.pouchImages.length; i++) {
      // console.log("this.pouchImages[" + i + "].pageName", this.pouchImages[i].pageName);
      this.image_1 = { name: this.pouchImages[i].pageName, completed: false, color: "warn" };
      this.image.deleteImage.push(this.image_1);
    }
  }

  confirmdialog() {

    for (let i = 0; i < this.image.deleteImage.length; i++) {
      if (this.image.deleteImage[i].completed == true) {
        this.finalDeletionList.push(this.image.deleteImage[i].name.slice());
      }
    }
    console.log("finalDeletionList=====" + this.finalDeletionList.length);
    this.imageService.setDeleteImagesList(this.finalDeletionList);

    const dialogRef = this.dialog.open(ScreenComponentConfirmDialog, {
      disableClose: true,
      width: '450px',
      panelClass: 'my-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  allComplete: boolean = false;
  updateAllComplete() {
    this.allComplete =
      this.image.deleteImage != null && this.image.deleteImage.every(t => t.completed);
  }

  someComplete(): boolean {
    if (this.image.deleteImage == null) {
      return false;
    }
    return (
      this.image.deleteImage.filter(t => t.completed).length > 0 &&
      !this.allComplete
    );
  }
  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.image.deleteImage == null) {
      return;
    }
    this.image.deleteImage.forEach(t => (t.completed = completed));
  }
}
export interface DeleteImageList {
  name: string;
  completed: boolean;
  color: ThemePalette;
  deleteImage?: DeleteImageList[];
}

@Component({
  selector: 'app-screen-ConfirmDialog',
  templateUrl: './screen.component.confirmdialog.html',
  styleUrls: ['./screen.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class ScreenComponentConfirmDialog {
  constructor(private imageService: ImageService, public dialog: MatDialog) { }

  deleteImagesConfirm() {
    // $('#imgToRead').selectAreas('destroy');
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    console.log("delete images");

    this.imageService.deleteImages();
  }
}
