import { Component, OnInit } from '@angular/core';
import { ImageService } from '../services/images.service';
import { Book} from '../shared/images.model';
import { AuthService } from '../auth/auth.service';
import { Router ,NavigationExtras} from "@angular/router";
import { BookService } from '../services/book.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import * as $ from 'jquery';
import { FileService } from '../services/file.service';
import * as fileSaver from 'file-saver';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-booksinfo',
  templateUrl: './booksinfo.component.html',
  styleUrls: ['./booksinfo.component.css']
})
export class BooksinfoComponent implements OnInit {
  userIsAuthenticated = false;
  userName;
  isAdmin;
  authListenerSubs;
  isLoadingfromServer;
  private bookSub:Subscription
  books: Book[]=[];
  bookMessage = "";
  folderName="";
  filesToBeUploaded;
  bookName;
  isLoading = false;
  FOLDER_BACKEND_URL;
  isDownloading = false;

  constructor(private imageService: ImageService,private router: Router, private fileService: FileService,
    public authService: AuthService,private bookService:BookService,public _d: DomSanitizer,private http: HttpClient) {
      this.FOLDER_BACKEND_URL = this.authService.BACKEND_URL + "/api/folder/";
     }

  ngOnInit(): void {
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

    this.bookService.getBooks();
    this.bookSub = this.bookService
		.getBookUpdateListener()
		.subscribe((bookData: { books: Book[]}) => {
		  this.books = bookData.books;
      const bookLength = this.books.length;
      console.log("book length "+bookLength);
      if (bookLength > 0) {
        this.bookMessage ="";
      }else{
        this.bookMessage = "No Books are available ";
      }
      console.log("bookMessage "+this.bookMessage)
    });

    this.bookService.isLoadingChange.subscribe(isLoading =>{
      this.isLoading= isLoading;
    });
    
  }

toScreen(){
  this.router.navigate(["/screen"]);
}
  navtoscreen(event){
    this.obtainbookname(event);
    var ele = event.target.value;
    let navigationExtras: NavigationExtras = {
      queryParams: {
        "data"   : ele,
      }
    }

    this.router.navigate(["/screen"], navigationExtras);
  }

  importFile(event) {
    // this.anotherTryVisible = true;
    this.filesToBeUploaded = (event.target as HTMLInputElement).files;
    var theFiles = event.target.files;
    var relativePath = theFiles[0].webkitRelativePath;
    this.folderName = relativePath.split("/");
   
    if(event.target.files && this.filesToBeUploaded && this.folderName[0] ==""){
      this.bookName = "miscellaneous";
      this.invokeUploadImage();

    }else if(event.target.files && this.filesToBeUploaded && this.folderName[0] !=""){
      var folderName = relativePath.split("/");
      this.bookName = folderName[0];
      this.invokeUploadImage();
    }
  }
  

  invokeUploadImage(){
    this.imageService.addImage(this.filesToBeUploaded,this.bookName);
  }

  openProgressDialog() {
    this.imageService.openProgressDialog();
  }
  onLogout() {
    this.authService.logout();
  }

  obtainbookname(event){
    var ele = event.target.value;
    this.bookName= ele;
    this.imageService.setBookName(this.bookName);
    
  }

  openMenu(event) {
   this.obtainbookname(event);
    event.preventDefault();
    $("#menu").css("display", "block");
    $("#menu").css("left", event.clientX+"px");
    $("#menu").css("top", event.clientY+"px");
    }

    closeMenu() {
      // if(this.isMenuOpen == true) {
        // this.isMenuOpen = false;
        $("#menu").css("display", "none");
      };

      deleteBook(){
        for(let i=0;i<this.books.length;i++){
          if(this.books[i].folderName == this.bookName){
            this.http.delete<{ message: string; completed:string}>(this.FOLDER_BACKEND_URL + this.bookName).subscribe(response => {
              if(response.completed == 'Y'){
                this.imageService.setDeleteImagesList(this.books[i].fileList);
                this.imageService.deleteImages();
                this.bookService.getBooks();
              }
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

}