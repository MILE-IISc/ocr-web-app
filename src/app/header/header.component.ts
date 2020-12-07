import { Component, EventEmitter, OnInit,Input, OnDestroy } from '@angular/core';
import * as $ from 'jquery';
import {ScreenComponent} from '../screen/screen.component';
import {HeaderService} from '../services/header.service';
import { ImageService } from '../services/images.service';
import { Images } from '../shared/images.model';
import { ViewerService } from '../services/viewer.service';
declare var Tiff: any;
import { AuthService } from "../auth/auth.service";
import { Subscription } from "rxjs";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {

  value:string;
  inputValue:String ;
  isTiff=false;
  localUrlArray: any[]=[];
  nextImage = true;
  multipleImage=true;
  loaded = false;
  imgFileCount = 0;
  imgWidth;
  images :Images[];
  display = 'none';
  nextImages = true;
  previousImages = true;
  public element:any;
  percentage:number;
  isLoading =false;

  // authenetication related
  userName: string;
  userIsAuthenticated = false;
  isAdmin;
  private authListenerSubs: Subscription;


  constructor(private authService: AuthService, private headerService : HeaderService,private imageService:ImageService,private viewerService:ViewerService) { }

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

    this.imageService.nextImageChange.subscribe( (nextImages: boolean) => {
      console.log("nextImages inside footer: "+nextImages);
      this.nextImages = nextImages;
   });

   this.imageService.previousImageChange.subscribe( (previousImages: boolean) => {
    console.log("nextImages inside footer: "+previousImages);
    this.previousImages = previousImages;
 });

 this.element=this.imageService.getDocumentId;
    this.imageService.documentChange.subscribe( (element: boolean) => {
      console.log("nextImages inside footer: "+element);
      this.element = element;
   });

  }
  selectedImage: string;
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
        this.isLoading = true;
        this.headerService. setloadingvalue(this.isLoading);
      }
    if (event.target.files && fileRead) {
      this.imageService.addImage(fileRead);
    }
  }

  NextImage(){
    this.imageService.nextPage();
    console.log("inside footer nextImage: "+this.imageService.nextImages);
    this.nextImages = this.imageService.nextImages;
    console.log("next Images"+this.nextImages);
  }

  previousImage(){
    this.imageService.previousPage();
    console.log("inside footer previousImage: "+this.imageService.previousImages);
    this.previousImages = this.imageService.previousImages;
    console.log("previous Images"+this.previousImages);
 }
 lastImage(){
  this.imageService.LastImage();
}

FirstImage(){
  this.imageService.firstImage();
}


asVertical(){
  this.viewerService.asVertical();
  this.value=this.viewerService.value;
  this.headerService.setHeaderValue(this.value);

  // this.viewerService.asVertical();
  console.log("asVertical has been invoked from screen");
  setTimeout(() => this.setpercentage(),50);


}

asHorizontal(){
  this.viewerService.asHorizontal();
  this.value=this.viewerService.value;
  // this.viewerService.asHorizontal();

  this.headerService.setHeaderValue(this.value);
  setTimeout(() => this.setpercentage(),50);


}




  openModalDialog(){
    this.images = this.imageService.getImages();
    this.imageService.openModalDialog(this.images,this.display);
  }

  closeModalDialog(){
    this.display='none';
   }
  openModalHelp(){
    this.display='block';
  }

  scrollUp(){
    console.log("in header element==="+this.element);
    console.log("inside scroll up")
    this.element.scrollBy(0,-50)
  }

  scrollDown(){
    console.log("in header element==="+this.element);
    console.log("inside scroll down")
    this.element.scrollBy(0, 50);
  }

  scrollLeft(){

    console.log("in header element==="+this.element);
    console.log("scroll left");
    this.element.scrollBy(-100, 0);
  }

  scrollRight(){

    console.log("in header element==="+this.element);
    console.log("scroll right");
    this.element.scrollBy(100, 0);
  }
  setpercentage(){
    this.percentage=  this.viewerService.getpercentage();



    this.headerService.setpercentagevary(this.percentage);

  }
  fitheight(){
    this.viewerService.fitheight();

    setTimeout(() => this.setpercentage(),50);
  }

  fitwidth(){

  this.viewerService.fitwidth()

  setTimeout(() => this.setpercentage(),50);

  }

  zoomInFun(){

   this.viewerService.zoomInFun();

  setTimeout(() => this.setpercentage(),50);
    }

  zoomOutFun(){

           this.viewerService.zoomOutFun();

          setTimeout(() => this.setpercentage(),50);
     }
     orginalsize(){

      this.viewerService.orginalsize();

      setTimeout(() => this.setpercentage(),50);

     }

}


 $('.multi-level-dropdown .dropdown-submenu > a').on("mouseenter", function(e) {
  var submenu = $(this);
  $('.multi-level-dropdown .dropdown-submenu .dropdown-menu').removeClass('show');
  submenu.next('.dropdown-menu').addClass('show');
  e.stopPropagation();
});

$('.multi-level-dropdown .dropdown').on("hidden.bs.dropdown", function() {
  // hide any open menus when parent closes
  $('.multi-level-dropdown .dropdown-menu.show').removeClass('show');
});


