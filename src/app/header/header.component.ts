import { Component, EventEmitter, OnInit,Input } from '@angular/core';
import * as $ from 'jquery';
import {ScreenComponent} from '../screen/screen.component';
import {HeaderService} from '../services/header.service';
import { ImageService } from '../services/images.service';
declare var Tiff: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {

  inputValue:String ;
  isTiff=false;
  localUrlArray: any[]=[];
  nextImage = true;
  multipleImage=true;
  loaded = false;
  imgFileCount = 0;
  imgWidth;


  constructor(private headerService : HeaderService,private imageService:ImageService) { }

  ngOnInit(): void {
  }selectedImage: string;
  anotherTryVisible: boolean;

  public localUrl: string;

  importFile(event) {
    this.anotherTryVisible = true;
    var fileRead = event.target.files;
    var filesCount = event.target.files.length;
    if(filesCount > 0)
      {
        this.nextImage = false;
        this.headerService.setMultipleImages(this.nextImage);
      }
    if (event.target.files && fileRead) {
      this.imageService.addImage(fileRead);
    }
  }
 }


