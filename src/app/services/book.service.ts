import { HttpClient } from "@angular/common/http";
import { EventEmitter, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { environment } from "../../environments/environment";
import { AuthService } from "../auth/auth.service";
import { Book } from "../shared/images.model";
import { PouchService } from "./pouch.service";


@Injectable({ providedIn: "root" })
export class BookService {

  FOLDER_BACKEND_URL;
  private books: any = [];
  dataUrlChange = new EventEmitter<any>();
  private booksUpdated = new Subject<{ books }>();
  isLoading = false;
  isLoadingChange = new EventEmitter<any>();

  // pouchDb & couchDb related declaration
  localUserDbInstance;
  remoteUserDbInstance;
  data;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private pouchService: PouchService) {
    this.FOLDER_BACKEND_URL = this.authService.BACKEND_URL + "/api/folder/";
  }

  async handleChange(change) {

    let changedDoc = null;
    let changedIndex = null;
    console.log("id of change on handleChange of bookService", change.id);
    console.log("doc of change on handleChange of bookService", change.doc);

    this.books.forEach((book: any, index) => {
      if (book._id === change.id) {
        changedDoc = book;
        changedIndex = index;
      }
    });

    //A document was deleted
    if (change.deleted) {
      this.books.splice(changedIndex, 1);
    }
    else {
      //A document was updated
      if (changedDoc) {
        this.books[changedIndex] = change.doc;
      }

      //A document was added
      else {
        this.books.push(change.doc);
      }
    }
    this.books = await this.sortBookList(this.books);
    this.booksUpdated.next({
      books: [...this.books]
    });

  }

  async sortBookList(books) {
    return new Promise(async (resolve, reject) => {
      await books.sort((a, b) => {
        var x = a.bookName.toLowerCase();
        var y = b.bookName.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
      });
      resolve(books);
    });
  }

  async getBooks() {
    // localUserDb Instance related
    let userDbDetails = await this.authService.getUserDbDetails();
    this.localUserDbInstance = await this.pouchService.createPouchDbInstance(userDbDetails.userDb);
    await this.pouchService.checkDbStatus(this.localUserDbInstance).then(status => {
      console.log("status of localDb of", userDbDetails.userDb, "is: ", status);
    });

    await this.localUserDbInstance.allDocs({
      include_docs: true
    }).then(async (result) => {
      this.books = [];
      console.log("books Info from db", result.rows.length);
      let docs = await result.rows.map((row) => {
        this.books.push(row.doc);
      });
    }).catch((error) => {
      console.log(error);
    });

    // Initial checking of bookDetails in Memory
    if (this.books.length > 0) {
      console.log("books Length", this.books.length);
      console.log("sending Initial bookDetails from Memory as its length is greater than 0");
      this.books = await this.sortBookList(this.books);
      this.booksUpdated.next({
        books: [...this.books]
      });
    }
    else {
      console.log("sending empty bookDetails from Memory as its length is not greater than 0");
      this.booksUpdated.next({
        books: []
      });
    }

    // remoteUserDb Instance related
    this.remoteUserDbInstance = await this.pouchService.createRemoteDbInstance(userDbDetails.dbUrl, userDbDetails.userDb, userDbDetails.userDbKey, userDbDetails.userDbPwd);
    await this.pouchService.checkDbStatus(this.remoteUserDbInstance).then(status => {
      console.log("status of remoteDb of", userDbDetails.userDb, "is: ", status);
    });

    // Based on localUserDb Instance changes, filling the memory
    let options = {
      live: true,
      retry: true,
      continuous: true
    };

    this.localUserDbInstance.changes({
      live: true, since: 'now', include_docs: true
    }).on('change', (change) => {
      console.log("calling handleChanges on localDbInstance change event");
      this.handleChange(change);
    }).on('error', function (err) {
      // handle error
      console.log("info on changes error", err);
    });
    this.localUserDbInstance.sync(this.remoteUserDbInstance, options);
  }

  async changeBookName(oldBookName, newBookName) {
    console.log("Inside BookService - oldBookName",oldBookName,"newBookName",newBookName);
    console.log("This.books.length",this.books.length);
    let renameDocument;
    if (this.books.length > 0) {
      for(let i=0; i < this.books.length; i++) {
        console.log("this.books[",i,"]",this.books[i]);
        if(this.books[i].bookName == oldBookName) {
          renameDocument = this.books[i];
          break;
        }
      }
      renameDocument.bookName = newBookName;
      this.localUserDbInstance.put(renameDocument).then((result, error) => {
        console.log("result", result);
        console.log("error", error);
        if (!error) {
          console.log("Pouch form saved successfully");
        }
      });
    }
  }

  getBookUpdateListener() {
    return this.booksUpdated.asObservable();
  }
}
