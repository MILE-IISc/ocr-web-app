
import { Component, OnInit, Renderer2 } from '@angular/core';

declare var Tiff: any;
import * as $ from 'jquery';
import { HeaderService } from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';

import { XmlModel } from '../shared/xml-model';
import { BlockModel} from '../shared/block-model';
import { AuthService } from '../auth/auth.service';
import {  MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider'
import { ModalContentComponent } from './modal-content.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';

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
  public tiffUrl: any;
  clientpercent;
  url;
  fileName: any;
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
  isRunningOcr = false;


  constructor(private headerService: HeaderService, private imageService: ImageService,
    private renderer: Renderer2,private authService:AuthService,public dialog: MatDialog) { }

    async openDialog() {
      this.dialog.open(ModalContentComponent, {
        width: '700px',
        height: '1000px',

      })


}
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

    this.imageService.angleChange.subscribe(rotationAngle =>{
      this.angle = rotationAngle;
      setTimeout(() => this.onEnter( this.angle), 2500);
    })
  }

  onEnter(value: number) {
    this.clientpercent = this.percentage;
    this.angle = value;
    this.imageService.angle = this.angle;
    this.imageService.onEnter();
  }

  onZoom(value: number) {
    this.clientpercent = this.percentage;
    this.percentage = value;
    this.imageService.percentage = this.percentage;
    this.imageService.onZoom();
    this.headerService.setpercentagevary(this.percentage);
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if ( block.length>0){ this.blocksize();}

  }

  asVertical() {
    this.value = 'horizontal';
    this.imageService.asVertical();
    this.percentage = this.imageService.percentage;
  }

  asHorizontal() {
    this.value = 'vertical';
    this.imageService.asHorizontal();
    this.percentage = this.imageService.percentage;
  }

  fitheight() {
    this.imageService.fitheight();
    this.percentage = this.imageService.percentage;
    this.headerService.setpercentagevary(this.percentage);
  }

  fitwidth() {
    this.clientpercent = this.percentage;
    this.imageService.fitwidth()
    this.percentage = this.imageService.percentage;
    console.log("this.percentage before header in fitwidth",this.percentage);
    this.headerService.setpercentagevary(this.percentage);
    console.log("this.percentage after header in fitwidth",this.percentage);
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if ( block.length>0){ this.blocksize();}
  }

  zoomInFun() {
    this.imageService.zoomInFun();
    this.percentage = this.imageService.percentage;
    this.headerService.setpercentagevary(this.percentage);
  }

  zoomOutFun() {
    this.imageService.zoomOutFun();
    this.percentage = this.imageService.percentage;
    this.headerService.setpercentagevary(this.percentage);
  }

  rotateImage() {
    this.imageService.rotateImage();
    this.angle = this.imageService.angle;
  }

  rotateImageanti() {
    this.imageService.rotateImageanti();
    this.angle = this.imageService.angle;
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
    this.headerService.setpercentagevary(this.percentage);
  }

  NextImage() {

    this.onEnter(0);
    this.imageService.nextPage();
 }

  previousImage() {
    this.onEnter(0);
    this.imageService.previousPage();
  }

  lastImage() {
    this.onEnter(0);
    this.imageService.LastImage();
  }

  firstImage() {
    this.onEnter(0);
    this.imageService.firstImage();
  }

  loadXMLDoc() {
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    this.imageService.getXmlFileAsJson(this.imageService.getCurrentImageName());
  }

  loadXMLDocAll() {
    this.imageService.getXmlFileAsJson2();
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
      }
      this.imageService.selectBlockservice()
    }
  }
}
