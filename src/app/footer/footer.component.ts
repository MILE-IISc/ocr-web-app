
import { Component, OnInit, Renderer2 } from '@angular/core';

declare var Tiff: any;
import * as $ from 'jquery';
import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
import { ViewerService } from '../services/viewer.service';
import { XmlModel } from '../shared/xml-model';
import { BlockModel} from '../shared/block-model';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})

export class FooterComponent implements OnInit {
  title = 'Layout';
  serverImages: Images[] = [];
  value = 'horizontal';
  imagewidth;
  selectedImage: string;
  anotherTryVisible: boolean;
  public localUrl: any;
  public tiffUrl: any;
  clientpercent;
  url;
  fileName: any;
  localUrlArray: any[] = [];
  files: any[] = []
  nextImages = true;
  previousImages = true;
  loaded = false;
  imgFileCount = 0;
  imgWidth;
  isTiff = false;
  fit: string;
  public percentage: number;
  public angle: number = 0.0;
  btnImgArray: any[] = [];
  display = "none";
  images: Images[];
  divelement = true;
  xmlFileName;
  urlOcr;
  JsonObj;

  constructor(private headerService: HeaderService, private imageService: ImageService, private viewerService: ViewerService,
    private renderer: Renderer2,private authService:AuthService) { }

  ngOnInit(): void {
    console.log("this.headerService.getpercentagevary()",this.headerService.getpercentagevary());
    this.percentage = this.headerService.getpercentagevary();
    this.headerService.percentageChange
      .subscribe(
        (percent: number) => {
          this.percentage = percent;
          console.log("percent inside footeroninit on headerpercentacgehange",percent);
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

  asVertical() {
    this.value = 'horizontal';
    this.viewerService.asVertical();
    console.log("asVertical has been invoked from screen");
    this.percentage = this.viewerService.percentage;
  }

  asHorizontal() {
    this.value = 'vertical';
    this.viewerService.asHorizontal();
    this.percentage = this.viewerService.percentage;
  }

  fitheight() {
    this.viewerService.fitheight();
    this.percentage = this.viewerService.percentage;
    console.log("this.percentage before header in fitheight",this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    console.log("this.percentage after header in fitheight",this.percentage);
  }

  fitwidth() {
    // this.viewerService.fitwidth();
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

  openModalDialog() {
    this.images = this.imageService.getImages();
    // this.imageService.openModalDialog(this.images, this.display);
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
    this.fileName = this.serverImages[this.imageService.imgFileCount].fileName;
    console.log("``````````````````````````````````````````````````this.fileName==="+this.fileName);
    console.log("this.fileCompleted==="+this.serverImages[this.imageService.imgFileCount].completed);
    this.imageService.getXmlFileAsJson(this.fileName);

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
        setTimeout(() => this.viewerService.selectBlockservice(), .001);
      }
    }
  }
}

function convertCanvasToImage(canvas) {
  console.log("in convert................");
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  console.log("image.src: " + image.src);
  return image;
}
