import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ImageService } from '../services/images.service';
import { Book } from '../shared/images.model';
import { AuthService } from '../auth/auth.service';
import { Router, NavigationExtras } from "@angular/router";
import { BookService } from '../services/book.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import * as $ from 'jquery';
import { FileService } from '../services/file.service';
import * as fileSaver from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { PouchService } from '../services/pouch.service';
import { InputDialogComponent } from './input-dialog/input-dialog.component';

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
  private bookSub: Subscription
  books = [];
  bookMessage = "";
  folderName = "";
  filesToBeUploaded;
  bookName;
  newBookName;
  isLoading = false;
  FOLDER_BACKEND_URL;
  isDownloading = false;
  message;

  constructor(private imageService: ImageService, private router: Router, private fileService: FileService, private pouchService: PouchService, public dialog: MatDialog,
    public authService: AuthService, private bookService: BookService, public _d: DomSanitizer, private http: HttpClient, private changeDetection: ChangeDetectorRef, private zone: NgZone) {
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

    this.isLoadingfromServer = true;

    this.bookService.getBooks();
    this.bookSub = this.bookService
      .getBookUpdateListener()
      .subscribe((bookData: { books: Book[] }) => {
        this.books = bookData.books;
        this.changeDetection.detectChanges();
        const bookLength = this.books.length;
        console.log("book length " + bookLength);
        if (bookLength > 0) {
          this.bookMessage = "";
        } else {
          this.bookMessage = "No Books are available. Please upload books or re-login(if books already uploaded)";
        }
        console.log("bookMessage " + this.bookMessage)
      });

    this.bookService.isLoadingChange.subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.imageService.ResumeUploadEvent.subscribe(() => {
      this.invokeUploadImage();
    });

    this.imageService.invalidMessageChange
    .subscribe(
      (message: string) => {
        console.log("message in booksDashboard======== " + message);
        this.message = message;
        if (this.message != "") {
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
  }

  navtoscreen(event) {
    this.obtainbookname(event);
    var ele = event.target.value;
    console.log("bookName in navToScreen",ele);
    console.log("this.bookName set in imageServices from obtainbookName",this.bookName);
    let navigationExtras: NavigationExtras = {
      queryParams: {
        "data": ele,
      }
    }

    this.zone.run(() => {
      this.router.navigate(["/screen"], navigationExtras);
  });
  }

  importFile(event) {
    // this.anotherTryVisible = true;
    this.filesToBeUploaded = (event.target as HTMLInputElement).files;
    var theFiles = event.target.files;
    var relativePath = theFiles[0].webkitRelativePath;
    this.folderName = relativePath.split("/");

    if (event.target.files && this.filesToBeUploaded && this.folderName[0] == "") {
      this.bookName = "miscellaneous";
      this.invokeUploadImage();

    } else if (event.target.files && this.filesToBeUploaded && this.folderName[0] != "") {
      var folderName = relativePath.split("/");
      this.bookName = folderName[0];
      this.invokeUploadImage();
    }
  }

  invokeUploadImage() {
    this.imageService.addImage(this.filesToBeUploaded, this.bookName, "DISPLAY_BOOKS");
  }

  // openProgressDialog() {
  //   this.imageService.openProgressDialog();
  // }
  onLogout() {
    this.authService.logout();
  }

  obtainbookname(event) {
    var ele = event.target.value;
    this.bookName = ele;
    this.imageService.setBookName(this.bookName);

  }

  openMenu(event) {
    this.obtainbookname(event);
    event.preventDefault();
    $("#menu").css("display", "block");
    $("#menu").css("left", event.clientX + "px");
    $("#menu").css("top", event.clientY + "px");
  }

  closeMenu() {
    // if(this.isMenuOpen == true) {
    // this.isMenuOpen = false;
    $("#menu").css("display", "none");
  };

  deleteBook() {
    for (let i = 0; i < this.books.length; i++) {
      console.log("this.books[i].bookName",this.books[i].bookName,"this.bookName",this.bookName);
      if (this.books[i].bookName == this.bookName) {
        console.log("Initaiating delete request");
        let bookDbName = "mile_book_db_"+this.books[i]._id;
        // this.imageService.setDeleteBookImagesList(bookDbName);
        // this.imageService.deleteImages();
        // this.bookService.getBooks();
      }
    }
  }

  async downloadXml2() {
    this.isDownloading = true;
    let bookDbName = "";
    if(this.books.length > 0) {
      for(let i = 0; i < this.books.length; i++) {
        console.log("books["+i+"]:",this.books[i]);
        if(this.bookName == this.books[i].bookName) {
          bookDbName = "mile_book_db_"+this.books[i]._id;
        }
      }
    } else {
      console.log("Unable to find book details.");
      alert("Unable to find book details.");
    }
    // return;
    console.log("calling this.fileService.downloadZipFile()");
    await this.fileService.downloadZipFile(bookDbName, this.bookName).then(response => {
      this.isDownloading = false;
      fileSaver(response, "OCR_output.zip");
    }), error => {
      console.log("Error while getting ZIP of XML files from server: " + error);
      alert(error);
    };
  }

  renameBook(): void {
    console.log("inside renameBook function");
    this.newBookName = "";
    const dialogRef = this.dialog.open(InputDialogComponent, {
      width: '250px',
      data: {oldBookName: this.bookName, newBookName: this.newBookName}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.newBookName = result;
      if(this.newBookName != null && this.newBookName.trim() != "") {
        console.log("newbookName is",this.newBookName);
        this.bookService.changeBookName(this.bookName, this.newBookName.trim());
      } else {
        console.log("newbookName is not entered");
      }
    });
  }
}

export interface DialogData {
  newBookName: string;
  oldBookName: string;
}
