import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { EventEmitter, Injectable, OnInit, Renderer2, RendererFactory2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as $ from 'jquery';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Images, ProgressInfo } from '../shared/images.model';
import { HeaderService } from '../services/header.service';
import { XmlModel, retain } from '../shared/xml-model';
import { BlockModel } from '../shared/block-model';
// import { HeaderService } from '../services/header.service';
import * as xml2js from 'xml2js';
import { MatDialog } from '@angular/material/dialog';
import { ProgressDialogComponent } from '../screen/progress-dialog/progress-dialog.component';
import { BookService } from './book.service';
import { PouchService } from './pouch.service';
import PouchDB from 'node_modules/pouchdb';
import { promises } from 'dns';


declare var Tiff: any;
declare var $: any;

@Injectable()
export class ImageService implements OnInit {
  displayImages;

  ngOnInit(): void {
    this.percentage = this.headerService.getpercentagevary();
    this.headerService.percentageChange
      .subscribe(
        (percent: number) => {
          this.percentage = percent;
        });

  }

  images: Array<Images> = [];
  localImages: Array<Images> = [];
  pouchImagesList: any = [];// This array will be used for storing imagesInfo of corresponding book from pouchDb
  private pouchImagesListUpdated = new Subject<{ pouchImagesList }>();
  currentBookDb;
  imgFileCount = 0;
  private imagesUpdated = new Subject<{ localImages: Images[] }>();

  fileName;
  public nextImages = false;
  public previousImages = false;
  imageCountChange = new EventEmitter<Number>();
  btnImgArrayChange = new EventEmitter<any>();
  nextImageChange = new EventEmitter<boolean>();
  isSelectBlockChange = new EventEmitter<boolean>();
  displayChange = new EventEmitter<any>();
  nextValueChange = new EventEmitter<any>();
  previousImageChange = new EventEmitter<boolean>();
  documentChange = new EventEmitter<any>();
  fileNameChange = new EventEmitter<any>();
  invalidMessageChange = new EventEmitter<any>();
  ocrMessageChange = new EventEmitter<any>();
  progressInfoChange = new EventEmitter<any>();
  ResumeUploadEvent = new EventEmitter<any>();
  uploadMessageChange = new EventEmitter<any>();
  angleChange = new EventEmitter<any>();
  bookNameChange = new EventEmitter<any>();
  ready = false;
  localImagesDb: any;

  btnImgArray: any[] = [];
  public localUrl: any;
  public documentElement;
  isLoadingfromServer;
  postedImages: any;
  serverUrl: any
  dataUrl: any;
  xmlFileName;
  IMAGE_BACKEND_URL;
  XML_BACKEND_URL;
  FOLDER_BACKEND_URL;
  invalidMessage;
  value: string;
  fit: string;
  public percentage: number;
  public angle: number = 0;
  private renderer: Renderer2;
  public clientpercent;
  obtainblock = false;
  isRunningOcrChange = new EventEmitter<any>();
  isLoadingFromServer = false;
  isLoadingFromServerChange = new EventEmitter<any>();
  progressInfos: ProgressInfo[] = [];
  runOcrAllFlag = false;
  deleteFlag = false;
  uploadImageFlag = false;
  runOcrLastIndex = 0;
  deleteLastIndex = 0;
  uploadImageLastIndex = 0;
  progressType = "";
  deleteImagesList = [];
  deleteFilesLastIndex = 0;
  uploadMessage = "";
  folderName = "";
  bookName = "";

  // pouchDb related declarations
  uploadLocalBookDbInstance;
  uploadRemoteBookDbInstance;
  currentLocalBookDbInstance;
  currentRemoteBookDbInstance;

  constructor(private route: ActivatedRoute, rendererFactory: RendererFactory2, private http: HttpClient, private router: Router, private authService: AuthService, private headerService: HeaderService, @Inject(DOCUMENT) private document: Document, public dialog: MatDialog, private bookService: BookService, private pouchService: PouchService) {
    this.IMAGE_BACKEND_URL = this.authService.BACKEND_URL + "/api/image/";
    this.XML_BACKEND_URL = this.authService.BACKEND_URL + "/api/xml/";
    this.FOLDER_BACKEND_URL = this.authService.BACKEND_URL + "/api/folder/";
    console.log("IMAGE_BACKEND_URL " + this.IMAGE_BACKEND_URL);
    console.log("XML_BACKEND_URL " + this.XML_BACKEND_URL);
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  getCurrentImageName() {
    return this.pouchImagesList[this.imgFileCount].pageName;
  }

  getBtnImages() {
    return this.btnImgArray.slice();
  }

  getProgressInfos() {
    return this.progressInfos.slice();
  }

  getProgressType() {
    return this.progressType;
  }

  resumeUploadImages() {
    this.ResumeUploadEvent.emit();
  }

  getbookName() {
    return this.bookName;
  }

  setBookName(bookName) {
    this.bookName = bookName;
  }

  async sortPouchImagesList(pouchImages) {
    console.log("sorting images list");
    return new Promise(async (resolve, reject) => {
      await pouchImages.sort((a, b) => {
        var x = a.pageName.toLowerCase();
        var y = b.pageName.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
      });
      resolve(pouchImages);
    });
  }

  async handleChange(change) {

    let changedDoc = null;
    let changedIndex = null;
    console.log("id of change on handleChange of imagesService", change.id);
    console.log("doc of change on handleChange of imagesService", change.doc);

    this.pouchImagesList.forEach((pouchImage: any, index) => {
      console.log("pouchImage._id:",pouchImage._id);
      console.log("change.id:",change.id);
      if (pouchImage._id === change.id) {
        changedDoc = pouchImage;
        changedIndex = index;
      }
    });

    //A document was deleted
    if (change.deleted && changedIndex != null) {
      this.pouchImagesList.splice(changedIndex, 1);
    }
    else {
      if (changedDoc && changedIndex != null) { //A document was updated
        this.pouchImagesList[changedIndex] = change.doc;
      } else {       //A document was added
          let fileName = change.id;
          if(fileName.substr((fileName.lastIndexOf('.') + 1)) != "xml") {
          this.pouchImagesList.push(change.doc);
        }
      }
    }
    if(changedIndex != null) {
      this.pouchImagesList = await this.sortPouchImagesList(this.pouchImagesList);
      console.log("pouchImagesList length after handling changes",this.pouchImagesList.length);
      this.pouchImagesListUpdated.next({
        pouchImagesList: [...this.pouchImagesList]
      });
    }

    if(change.id == (this.pouchImagesList[this.imgFileCount].pageName.slice(0, -3)+ "xml")) {
      this.onXml();
    }
  }

  async getServerImages() {
    var bookName = this.route.snapshot.queryParams['data'];
    var folderName = bookName;
    const queryParams = `?folderName=${folderName}`;
    let tempPouchImagesList = [];

    console.log("enter get server from screen");
    return new Promise(async (resolve, reject) => {
    // pouchDb usage starts here
    // localUserDb Instance related
    let books: any = [];
    let userDbDetails = await this.authService.getUserDbDetails();
    let localUserDbInstance = await this.pouchService.createPouchDbInstance(userDbDetails.userDb);
    await this.pouchService.checkDbStatus(localUserDbInstance).then(status => {
      console.log("status of localDb of", userDbDetails.userDb, "is: ", status);
    });

    await localUserDbInstance.allDocs({
      include_docs: true
    }).then((result) => {
      books = [];
      console.log("books Info from db", result.rows.length);
      let docs = result.rows.map((row) => {
        books.push(row.doc);
      });
    }).catch((error) => {
      console.log(error);
    });

    for (let i = 0; i < books.length; i++) {
      if (books[i].bookName == bookName) {
        this.currentBookDb = "mile_book_db_" + books[i]._id;
      }
    }

    // local BookDb Instance related
    this.currentLocalBookDbInstance = await this.pouchService.createPouchDbInstance(this.currentBookDb);
    await this.pouchService.checkDbStatus(this.currentLocalBookDbInstance).then(status => {
      console.log("status of localDb of", this.currentBookDb, "is: ", status);
    });

    await this.currentLocalBookDbInstance.allDocs({
      include_docs: true
    }).then((result) => {
      this.pouchImagesList = [];
      tempPouchImagesList = [];
      console.log("tempPouchImagesList Info from db", result.rows.length);
      let docs = result.rows.map((row) => {
        tempPouchImagesList.push(row.doc);
      });
    }).catch((error) => {
      console.log(error);
    });

    await tempPouchImagesList.map(tempPouchImage => {
        let fileName = tempPouchImage.pageName;
        if(fileName.substr((fileName.lastIndexOf('.') + 1)) != "xml") {
        this.pouchImagesList.push(tempPouchImage);
      }
    });

    // Initial checking of imageDetails in local currentBookDb and filling the same in memory
    if (this.pouchImagesList.length > 0) {
      console.log("this.pouchImagesList Length", this.pouchImagesList.length);
      console.log("sending Initial bookDetails from Memory as its length is greater than 0");
      this.pouchImagesList = await this.sortPouchImagesList(this.pouchImagesList);
      this.pouchImagesListUpdated.next({
        pouchImagesList: [...this.pouchImagesList]
      });
    }
    else {
      console.log("sending empty bookDetails from Memory as its length is not greater than 0");
      this.pouchImagesListUpdated.next({
        pouchImagesList: []
      });
    }

    // remote BookDb Instance related
    this.currentRemoteBookDbInstance = await this.pouchService.createRemoteDbInstance(this.currentBookDb, userDbDetails.userDbKey, userDbDetails.userDbPwd);
    await this.pouchService.checkDbStatus(this.currentRemoteBookDbInstance).then(status => {
      console.log("status of remoteDb of", this.currentBookDb, "is: ", status);
    });

    // Based on localCurrentBookDb Instance changes, filling the memory
    let options = {
      live: true,
      retry: true,
      continuous: true
    };

    this.currentLocalBookDbInstance.changes({
      live: true, since: 'now', include_docs: true
    }).on('change', (change) => {
      console.log("calling handleChanges on localDbInstance change event");
      this.handleChange(change);
    }).on('error', function (err) {
      // handle error
      console.log("info on changes error", err);
    });
    await this.currentLocalBookDbInstance.sync(this.currentRemoteBookDbInstance, options);
    console.log("resolving in getServerImages");
    resolve(true);
  });
  }

  getXmlFileAsJson(fileName: any) {
    var bookName = this.route.snapshot.queryParams['data'];
    var xmlFileName = fileName;
    this.isRunningOcrChange.emit(true);
    console.log("Running OCR on " + xmlFileName);
    const queryParams = `?fileName=${xmlFileName}&bookDb=${this.currentBookDb}&type=GET-OCR-XML`;
    this.http.get<{ message: string; completed: string }>(this.XML_BACKEND_URL + queryParams).subscribe(response => {
      this.localImages = this.getLocalImages();
      if (this.localImages.length > 0) {
        for (let i = 0; i < this.localImages.length; i++) {
          if (this.localImages[i].fileName == fileName) {
            console.log("name" + this.localImages[i].fileName);
            this.localImages[i].completed = response.completed;
            console.log("completed" + this.localImages[i].completed);
          }
        }
      }
      this.isRunningOcrChange.emit(false);
      this.ocrMessageChange.emit(response.message);
      // this.onXml();
      // XmlModel.jsonObject = response.xmlData;
      // this.updateXmlModel(XmlModel.jsonObject);
    });
  }

  getXmlFileAsJson2() {
    this.progressType = 'RUN_OCR';
    if (this.pouchImagesList.length > 0) {
      var runOcr = (x) => {
        if (x == 0) {
          this.uploadMessage = "";
          this.uploadMessageChange.emit(this.uploadMessage);
          this.progressInfos.splice(0, this.progressInfos.length);
          this.openProgressDialog();
          for (let i = 0; i < this.pouchImagesList.length; i++) {
            var status = 'Pending';
            const progress = new ProgressInfo(this.pouchImagesList[i].pageName, status);
            this.progressInfos.push(progress);
            this.progressInfoChange.emit(this.progressInfos);
          }
        }
        if (x < this.pouchImagesList.length) {
          var bookName = this.route.snapshot.queryParams['data'];
          let fileName = this.pouchImagesList[x].pageName;
          var xmlFileName = fileName + "-" + bookName;
          console.log("Running OCR on " + fileName);
          this.progressInfos[x].value = 'Running';
          this.progressInfoChange.emit(this.progressInfos.slice());
          const queryParams = `?fileName=${xmlFileName}&bookDb=${this.currentBookDb}&type=GET-OCR-XML-ALL`;
          this.http.get<{ message: string; completed: string }>(this.XML_BACKEND_URL + queryParams).subscribe(response => {
            this.ocrMessageChange.emit(response.message);
            if (response.completed == 'Y') {
              // this.localImages[x].completed = response.completed;
              this.progressInfos[x].value = 'Completed';
              this.progressInfoChange.emit(this.progressInfos.slice());
            } else {
              this.progressInfos[x].value = 'Failed';
              this.progressInfoChange.emit(this.progressInfos.slice());
            }
            this.runOcrLastIndex = x;
            if (this.runOcrLastIndex == (this.pouchImagesList.length - 1)) {
              this.uploadMessage = "Run-OCR on all images is completed !!"
              this.uploadMessageChange.emit(this.uploadMessage);
              var btn = document.getElementById("pauseButton");
              btn.innerHTML = 'Ok';
            }
            if (this.runOcrAllFlag == true) {
              runOcr(x + 1);
            }
          });
        }
      }

      if (this.runOcrAllFlag == false) {
        this.runOcrAllFlag = true;
        runOcr(0);
      } else {
        runOcr(this.runOcrLastIndex);
      }
    }
  }

  setRunOcrAllFlag(status) {
    this.runOcrAllFlag = status;
  }

  getRunOcrAllFlag() {
    return this.runOcrAllFlag;
  }

  stopRunOcrOnAll() {
    this.setRunOcrAllFlag(false);
    this.runOcrLastIndex = 0;
  }

  updateXmlModel(jsonObj) {
    if (jsonObj && jsonObj['page']) {
      var blocks = [];
      if (jsonObj['page'].block) {
        blocks = jsonObj['page'].block;
      }
      if (jsonObj['page']["$"].rotationAngle) {
        console.log("rotation angle " + jsonObj['page']["$"].rotationAngle)
        this.angle = jsonObj['page']["$"].rotationAngle;
        this.angleChange.emit(this.angle);
      }
      for (var b = 0; b < blocks.length; b++) {
        var block = blocks[b];
        if (block.line) {
          var lines = block.line;
          for (var l = 0; l < lines.length; l++) {
            var line = lines[l];
            if (line.word) {
              var lineText = "";
              var words = line.word;
              for (var w = 0; w < words.length; w++) {
                var wordText = words[w]["$"].unicode;
                if (wordText != null) {
                  lineText += " " + wordText;
                }
              }
              var lineRowStart = line["$"].rowStart;
              var lineRowEnd = line["$"].rowEnd;
              var lineColStart = line["$"].colStart;
              var lineColEnd = line["$"].colEnd;
              var lineNumber = line["$"].LineNumber;
              var blockNumber = block["$"].BlockNumber;
              var lineWidth = lineColEnd - lineColStart + 1;
              var lineHeight = lineRowEnd - lineRowStart + 1;
              var lineInfo = new XmlModel(lineText, lineRowStart, lineRowEnd, lineColStart, lineColEnd, lineWidth, lineHeight, lineNumber, blockNumber);
              XmlModel.textArray.push(lineInfo);
              XmlModel.textArray.slice(0, XmlModel.textArray.length);
            }
          }
        }
      }
    }
  }

  getImageUpdateListener() {
    return this.imagesUpdated.asObservable();
  }

  getPouchImageUpdateListener() {
    return this.pouchImagesListUpdated.asObservable();
  }


  setDocumentId(element) {
    this.documentElement = element;
    this.documentChange.emit(this.documentElement);
  }

  getDocumentId() {
    return this.documentElement.slice();
  }

  urlChanged = new EventEmitter<string>();
  url: string;

  setUrl(localUrl) {
    this.url = localUrl;
    this.urlChanged.emit(this.url);
  }

  getUrl() {
    return this.url;
  }

  getUploadMessage() {
    return this.uploadMessage;
  }

  getLocalImages() {
    return this.localImages.slice();
  }

  async addImage(filesToBeUploaded, folderName, display) {
    let sortedFilesList = [];
    this.folderName = folderName;
    let bookDbName = "";
    this.progressType = 'UPLOAD_IMAGE';
    let queryParams = "";

    await this.updateFolderNameinDB(folderName).then(async (response: any) => {
      bookDbName = response.bookDbName;
      queryParams = `?bookDbName=${bookDbName}`;
      let userDbDetails = this.authService.getUserDbDetails();
      console.log("response on bookInfoUpdate bookDbName", bookDbName, "bookDbKey", response.bookDbKey);
      console.log("userDbDetails from AuthService userDbKey", userDbDetails.userDbKey, "userDbPwd", userDbDetails.userDbPwd);

      // local BookDb Instance related
      this.uploadLocalBookDbInstance = await this.pouchService.createPouchDbInstance(bookDbName);
      await this.pouchService.checkDbStatus(this.uploadLocalBookDbInstance).then(status => {
        console.log("status of localDb of", bookDbName, "is: ", status);
      });

      // remote BookDb Instance related
      this.uploadRemoteBookDbInstance = await this.pouchService.createRemoteDbInstance(bookDbName, userDbDetails.userDbKey, userDbDetails.userDbPwd);
      await this.pouchService.checkDbStatus(this.uploadRemoteBookDbInstance).then(status => {
        console.log("status of remoteDb of", bookDbName, "is: ", status);
      });

      let options = {
        live: true,
        retry: true,
        continuous: true
      };

      this.uploadLocalBookDbInstance.changes({
        live: true, since: 'now', include_docs: true
      }).on('change', (change) => {
        console.log("calling handleChanges on localDbInstance change event");
        // this.handleChange(change);
      }).on('error', function (err) {
        // handle error
        console.log("info on changes error", err);
      });
      this.uploadLocalBookDbInstance.sync(this.uploadRemoteBookDbInstance, options);
      console.log("localBookDb Instance sync executed");
    });

    for (let i = 0; i < filesToBeUploaded.length; i++) {
      sortedFilesList.push(filesToBeUploaded[i]);
    }
    console.log("sortedFilesList", sortedFilesList);
    console.log("sortedFilesList.length", sortedFilesList.length);
    console.log("sortedFilesList[0]", sortedFilesList[0]);

    console.log("sorting started");
    sortedFilesList.sort((a, b) => {
      var x = a.name.toLowerCase();
      var y = b.name.toLowerCase();
      if (x < y) { return -1; }
      if (x > y) { return 1; }
      return 0;
    });
    console.log("sorting completed");
    console.log("sortedFilesList[0] after sorting", sortedFilesList[0]);
    // return;
    if (sortedFilesList.length > 0) {
      console.log("after if condition of sortedFilesList.length > 0");
      var uploadImage = (x) => {
        if (x == 0) {
          this.progressInfos.splice(0, this.progressInfos.length);
          this.uploadMessage = "";
          this.uploadMessageChange.emit(this.uploadMessage);
          this.openProgressDialog();
          for (let i = 0; i < sortedFilesList.length; i++) {
            var status = 'Pending';
            const progress = new ProgressInfo(sortedFilesList[i].name, status);
            this.progressInfos.push(progress);
            this.progressInfoChange.emit(this.progressInfos);
          }
        }
        if (x < sortedFilesList.length) {
          let fileName = sortedFilesList[x].name;
          this.progressInfos[x].value = 'Uploading';
          this.progressInfoChange.emit(this.progressInfos.slice());

          let imageData = new FormData();
          imageData.append("email", this.authService.userName);
          var file = sortedFilesList[x];
          console.log("file name===" + file.name);
          imageData.append("image", file);
          this.http.post<{ message: string, uploaded: string }>(this.IMAGE_BACKEND_URL + queryParams, imageData).subscribe(async response => {
            this.invalidMessage = response.message;
            this.invalidMessageChange.emit(this.invalidMessage);
            if (response.uploaded == "Y") {
              this.progressInfos[x].value = 'Uploaded';
            } else {
              this.progressInfos[x].value = 'Failed';
            }
            this.progressInfoChange.emit(this.progressInfos.slice());
            this.uploadImageLastIndex = x;
            if (this.uploadImageLastIndex == (sortedFilesList.length - 1)) {
              this.uploadMessage = "Images Uploaded Successfully !!"
              this.uploadMessageChange.emit(this.uploadMessage);
              var btn = document.getElementById("pauseButton");
              btn.innerHTML = 'Ok';
              this.uploadLocalBookDbInstance.close();
              this.uploadRemoteBookDbInstance.close();
              console.log("this.pouchImagesList.length",this.pouchImagesList.length);
              console.log("calling updateBookThumbnail()");
              await this.updateBookThumbnail(bookDbName);
              if(display == "DISPLAY_BOOKS") {
                console.log("calling getBooks()");
                this.bookService.getBooks();
              } else {
                console.log("calling getServerImages()");
                await this.getServerImages();
              }
            }
            if (this.uploadImageFlag == true) {
              uploadImage(x + 1);
            }
          });
        }
      }

      if (this.uploadImageFlag == false) {
        this.uploadImageFlag = true;
        console.log("invoking uploadImage(0) ");
        uploadImage(0);
      } else {
        uploadImage(this.uploadImageLastIndex);
      }
    }

  }

  async updateBookThumbnail(bookDbName: string) {
    // localUserDb Instance related
    let userDbDetails = await this.authService.getUserDbDetails();
    let bookImages: any = [];
    let tempLocalUserDbInstance = await this.pouchService.createPouchDbInstance(userDbDetails.userDb);
    await this.pouchService.checkDbStatus(tempLocalUserDbInstance).then(status => {
      console.log("status of localDb of", userDbDetails.userDb, "is: ", status);
    });

    // local BookDb Instance related
    let tempLocalbookDbInstance = await this.pouchService.createPouchDbInstance(bookDbName);
    await this.pouchService.checkDbStatus(tempLocalbookDbInstance).then(status => {
      console.log("status of localDb of", bookDbName, "is: ", status);
    });
    await tempLocalbookDbInstance.allDocs({
      include_docs: true
    }).then(async (result) => {
      console.log("books Info from db", result.rows.length);
      await result.rows.map((row) => {
        bookImages.push(row.doc);
      });
    });
    bookImages = await this.sortBookImagesList(bookImages);
    let thumbnailImage = bookImages[0].pageThumbnail;
    let bookDocumentId = bookDbName.replace('mile_book_db_', '');
    let bookDocument = await tempLocalUserDbInstance.get(bookDocumentId).then((bookDocument) => {
        console.log("bookDocument retrieved for updating thumbnail", bookDocument);
        return bookDocument;
      }).catch((err) => {
        console.log("Unable to retrieve the document for",bookDocumentId);
      });
    bookDocument.bookThumbnailImage = thumbnailImage;
    await tempLocalUserDbInstance.put(bookDocument).then((response) => {
      console.log("bookThumbnail has been updated for", bookDocument.bookName, "with response", response);
    }).catch((err) => {
      console.log("error while updating bookThumbnail", err);
    });
    // emptying the bookImages List after its usage is completed and closing tempLocalbookDbInstance connection
    bookImages = [];
    tempLocalbookDbInstance.close();
    tempLocalUserDbInstance.close();
  }

  async sortBookImagesList(books) {
    return new Promise(async (resolve, reject) => {
      await books.sort((a, b) => {
        var x = a.pageName.toLowerCase();
        var y = b.pageName.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
      });
      resolve(books);
    });
  }

  updateFolderNameinDB(folderName) {
    return new Promise((resolve, reject) => {
      let jsonData: any;
      jsonData = {
        user: this.authService.userName,
        userDbName: this.authService.userDb,
        folderName: folderName
      };
      this.http.post<{ message: string, bookDbName: string, bookDbKey: string }>(this.FOLDER_BACKEND_URL, jsonData).subscribe(async response => {
        console.log("response message on book Db Creation", response.message, "bookDbName", response.bookDbName, "bookDbkey", response.bookDbKey);
        resolve(response);
      });
    })
  }

  setUploadImageFlag(status) {
    this.uploadImageFlag = status;
  }

  getuploadImageFlag() {
    return this.uploadImageFlag;
  }

  stopUploadImage() {
    this.setUploadImageFlag(false);
    this.uploadImageLastIndex = 0;
  }

  async saveImagesPouchDb(id, data, ETag, LastModified, revId) {
    var imageform = {
      _id: id,
      name: id,
      data: data,
      ETag: ETag,
      LastModified: LastModified,
      _rev: revId
    }
    this.localImagesDb = new PouchDB("mile_images_db", { revs_limit: 1, auto_compaction: true, skip_setup: true });
    this.localImagesDb.put(imageform).then((result, error) => {
      console.log("result", result);
      console.log("error", error);
      if (!error) {
        console.log("Pouch form saved successfully");
      }
      return true;
    });
  }

  async loadArray(serverImage: any) {
    // getting all docs in list
    this.localImagesDb = new PouchDB("mile_images_db", {auto_compaction: true});
    this.localImagesDb.allDocs().then((result) => {
      console.log("result.rows.length",result.rows.length);
      for(let i = 0; i < result.rows.length; i++) {
        console.log("id of doc "+i,result.rows[i].id);
      }
    });
    this.isLoadingFromServerChange.emit(true);
    let jpegFile = serverImage;
    console.log("inside load array", serverImage);
    let objectHeaderInfo: any = await this.getHeaderInfo(serverImage);
    if (objectHeaderInfo != "") {
      console.log("objectHeaderInfo for imagename", serverImage);
      console.log("LastModified", objectHeaderInfo.LastModified);
      console.log("ETag", objectHeaderInfo.ETag);
      console.log("ContentType", objectHeaderInfo.ContentType);
      this.localImagesDb = new PouchDB("mile_images_db", {auto_compaction: true});
      if(serverImage.substr((serverImage.lastIndexOf('.') + 1)) == "tif") {
        jpegFile = serverImage.slice(0, -3) + 'jpg';
      }
      let document = await this.localImagesDb.get(jpegFile).then(function (doc) {
        return doc;
      }).catch(function (err) {
        console.log("error status", err.status);
        if (err.status == "404") {
          return "NOT_FOUND";
        }
      });

      if (document == "NOT_FOUND") {
        console.log("getting serverImageData for ",serverImage);
        let data = await this.getServerImage(serverImage);
        await this.saveImagesPouchDb(jpegFile, data, objectHeaderInfo.ETag, objectHeaderInfo.LastModified, "").then(() => {
          console.log("saved image", jpegFile);
        });
        return data;
      } else {
        console.log("document from PouchDb for", document.name);
        console.log("document.ETag", document.ETag);
        console.log("document.LastModified", document.LastModified);
        console.log("document.revId", document._rev);
        if (jpegFile == document.name && document.ETag == objectHeaderInfo.ETag) {
          console.log("date for both documents matches");
          let pouchDbImageData = await this.localImagesDb.get(jpegFile);
          return pouchDbImageData.data;
        } else if (jpegFile == document.name && document.ETag != objectHeaderInfo.ETag) {
          console.log("IbmCosObject ETag doesn't match with PouchDbObject ETag");
          let data = await this.getServerImage(serverImage);
          this.saveImagesPouchDb(jpegFile, data, objectHeaderInfo.ETag, objectHeaderInfo.LastModified, document._rev).then(() => {
            console.log("updated image", jpegFile);
          });
          return data;
        }
      }
    }
  }

  async getServerImage(serverImage) {
    let promise = new Promise((resolve, reject) => {
      var bookName = this.route.snapshot.queryParams['data'];
      var folderName = bookName;
      const queryParams = `?folderName=${folderName}&type=GET-DATA`;
      this.http.get<{ message: string; json: any }>(this.IMAGE_BACKEND_URL + serverImage + queryParams).subscribe(responseData => {
        this.isLoadingFromServerChange.emit(false);
        resolve(responseData.json);
      });
    });
    return promise;
  }

  async getHeaderInfo(serverImage: any) {
    this.isLoadingFromServerChange.emit(true);
    console.log("inside load array", serverImage);

    let promise = new Promise((resolve, reject) => {
      var user = this.authService.userName;
      const queryParams = `?user=${user}&type=GET-HEADER`;
      this.http.get<{ message: string; json: any }>(this.IMAGE_BACKEND_URL + serverImage + queryParams).subscribe(responseData => {
        this.isLoadingFromServerChange.emit(false);
        if (responseData.json != "") {
          console.log("got header info");
        }
        resolve(responseData.json);
      });
    });
    return promise;
  }

  updateCorrectedXml(fileName: any) {
    // console.log("Corrected xml " + JSON.stringify(XmlModel.jsonObject));
    var bookName = this.route.snapshot.queryParams['data']
    var folderName = bookName;
    const queryParams = `?folderName=${folderName}`;
    let jsonData: any;
    jsonData = {
      json: XmlModel.jsonObject,
      XmlfileName: fileName.slice(0, -3) + 'xml',
      user: this.authService.userName
    };
    this.http.put<{ message: string, completed: string }>(this.XML_BACKEND_URL + queryParams, jsonData).subscribe(response => {
        console.log("response message after correction " + response.message);
        this.headerService.setloadmessage(response.message);
        this.localImages = this.getLocalImages();
        console.log("server image length in update " + this.localImages.length);
        if (this.localImages.length > 0) {
          for (let i = 0; i < this.localImages.length; i++) {
            // console.log("jsonData.XmlfileName ", jsonData.XmlfileName, "this.localImages[" + i + "].fileName ", this.localImages[i].fileName);
            if (this.localImages[i].fileName.slice(0, -3) + 'xml' == jsonData.XmlfileName) {
              console.log("name" + this.localImages[i].fileName);
              this.localImages[i].completed = response.completed;
              console.log("completed" + this.localImages[i].completed);
            }
          }
        } else {
          for (let i = 0; i < this.localImages.length; i++) {
            if (this.localImages[i].fileName.slice(0, -3) + 'xml' == jsonData.XmlfileName) {
              console.log("name" + this.localImages[i].fileName);
              this.localImages[i].completed = response.completed;
              console.log("completed" + this.localImages[i].completed);
            }
          }
        }
      });
  }

  openModalDialog() {
    console.log("images count inside subscribe: " + this.pouchImagesList.length);
    this.btnImgArray.splice(0, this.btnImgArray.length);
    for (let i = 0; i < this.pouchImagesList.length; i++) {
      var btnImgEle = "<button  style=\"width: 100%; border: none;\" (click)=\"openThisImage()\" class=\"btnImg\" value=\"" + this.pouchImagesList[i].pageName + "\"  id=\"" + this.pouchImagesList[i]._id + "\">" + this.pouchImagesList[i].pageName + "</button>";
      // console.log("btnImgEle: " + btnImgEle);
      this.btnImgArray.push(btnImgEle);
      this.btnImgArrayChange.emit(this.btnImgArray.slice());
    }
    console.log("images count inside btnImgArray: " + this.btnImgArray.length);
    $(".sideBody").empty();
    for (let i = 0; i < this.btnImgArray.length; i++) {
      $(".sideBody").append(this.btnImgArray[i]);
    }
  }

  openProgressDialog() {
    const dialogRef = this.dialog.open(ProgressDialogComponent, {
      disableClose: false,
      height: '500px',
      width: '500px',
      panelClass: 'my-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
    });
  }

  closeProgressDialog() {
    this.dialog.closeAll();
  }

  async nextPage() {
    this.isRunningOcrChange.emit(false);
    this.imgFileCount++;
    this.imageCountChange.emit(this.imgFileCount);
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    // console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();

    this.localUrl = await this.loadArray(this.pouchImagesList[this.imgFileCount].pageName);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.pouchImagesList[this.imgFileCount].pageName;
    this.fileNameChange.emit(this.fileName);
    // console.log("inside Next this.imgFileCount after incrementing: " + this.imgFileCount);
    this.onXml();

    if (this.pouchImagesList.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
    }
    if (this.imgFileCount > 0) {
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }
  }

  async previousPage() {
    this.isRunningOcrChange.emit(false);
    this.imgFileCount--;
    this.imageCountChange.emit(this.imgFileCount);
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    // console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    this.localUrl = await this.loadArray(this.pouchImagesList[this.imgFileCount].pageName);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.pouchImagesList[this.imgFileCount].pageName;
    this.fileNameChange.emit(this.fileName);
    // console.log("inside Next this.imgFileCount after decrementing: " + this.imgFileCount);
    this.onXml();
    if (this.pouchImagesList.length - 1 > this.imgFileCount) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
    if (this.imgFileCount == 0) {
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }
  }

  async LastImage() {
    this.isRunningOcrChange.emit(false);
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    // console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();

    this.imgFileCount = this.pouchImagesList.length - 1;
    this.imageCountChange.emit(this.imgFileCount);
    this.localUrl = await this.loadArray(this.pouchImagesList[this.imgFileCount].pageName);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.pouchImagesList[this.imgFileCount].pageName;
    this.fileNameChange.emit(this.fileName);
    this.onXml();
    if (this.pouchImagesList.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }
  }

  async firstImage() {
    this.isRunningOcrChange.emit(false);
    this.imgFileCount = 0;
    this.imageCountChange.emit(this.imgFileCount);
    if (this.obtainblock == true) {
      $('#imgToRead').selectAreas('reset');
    }
    // console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();

    this.localUrl = await this.loadArray(this.pouchImagesList[this.imgFileCount].pageName);
    this.urlChanged.emit(this.localUrl.slice());
    this.fileName = this.pouchImagesList[this.imgFileCount].pageName;
    this.fileNameChange.emit(this.fileName);
    this.onXml();

    if (this.imgFileCount == 0) {
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
    }
  }

  buttonEnable() {
    this.isRunningOcrChange.emit(false);
    if (this.pouchImagesList.length - 1 == 0) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }

    else if (this.pouchImagesList.length - 1 == this.imgFileCount) {
      this.nextImages = true;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }

    else if ((this.pouchImagesList.length - 1 > 0) && (this.imgFileCount == 0)) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = true;
      this.previousImageChange.emit(this.previousImages);
    }
    else if ((this.pouchImagesList.length - 1 > 0) && (this.pouchImagesList.length - 1 !== this.imgFileCount)) {
      this.nextImages = false;
      this.nextImageChange.emit(this.nextImages);
      this.previousImages = false;
      this.previousImageChange.emit(this.previousImages);
    }

  }

  onXml() {
    console.log("entered onXml");
      this.fileName = this.pouchImagesList[this.imgFileCount].pageName;
      this.getFileAsJson(this.fileName);
  }

  async getFileAsJson(fileName: any) {
    console.log("entered getFileAsJson");
    let xmlFileName = fileName.slice(0, -3) + "xml";
    let document = await this.currentLocalBookDbInstance.get(xmlFileName).then(function (doc) {
      return doc;
    }).catch(function (err) {
      console.log("error status", err.status);
      if (err.status == "404") {
        return "NOT_FOUND";
      }
    });

    console.log("empty the right side screen");
    $(".textElementsDiv").not(':first').remove();
    $(".textSpanDiv").empty();
    if(document != "NOT_FOUND") {
      console.log("document.data",document.data);
      XmlModel.jsonObject = document.data;
      this.retain(XmlModel.jsonObject);
      this.updateXmlModel(XmlModel.jsonObject);
    }
  }

  retain(jsonObj) {
    console.log("inside retain this.obtainblock:",this.obtainblock);
    if (this.obtainblock == true) {
      let areaarray = [];
      // var jsonObj = JSON.parse(json);
      if (jsonObj && jsonObj['page'] && jsonObj['page'].block) {
        var blocks = jsonObj['page'].block;
        //  console.log("block length " + blocks.length);

        for (var i = 0; i < blocks.length; i++) {
          var blockNumber = (blocks[i]["$"].BlockNumber);
          // console.log("blockNumber" + blockNumber);
          // console.log("blockRowStart from json " + blocks[i].rowStart);
          var blockRowStart = blocks[i]["$"].rowStart;
          var blockRowEnd = blocks[i]["$"].rowEnd;
          var blockColStart = blocks[i]["$"].colStart;
          var blockColEnd = blocks[i]["$"].colEnd;
          var x = (blockColEnd - blockColStart);
          // console.log("x in retain " + x);
          // console.log("percentage in retain ***************" + this.percentage);
          var blockwidth = (blockColEnd - blockColStart) * this.percentage / 100;
          // console.log("blockwidth" + blockwidth);
          var blockheight = (blockRowEnd - blockRowStart) * this.percentage / 100;
          // console.log("blockheight" + blockheight);
          var X = blockColStart * this.percentage / 100;
          // console.log("blockX" + X);
          var Y = blockRowStart * this.percentage / 100;
          // console.log("blockY" + Y);
          areaarray[i] = { "id": blockNumber, "x": X, "y": Y, "width": blockwidth, "height": blockheight };
        }
        $('img#imgToRead').selectAreas('destroy');
        $('img#imgToRead').selectAreas({
          onChanged: debugQtyAreas,
          areas: areaarray
        });

        $('#buttonXml').click(function () {
          // console.log("onclick");
          $('#imgToRead').selectAreas('destroy');
        });
        $('.btnImg').click(function () {
          $('#imgToRead').selectAreas('reset');
        });
        function debugQtyAreas(event, id, areas) {
          // console.log(areas.length + " areas", arguments);
          this.displayarea = areas;
          // console.log(areas.length + " this.displayarea", arguments);
        };
      }
    }
  }
  screenview() {
    if (this.fit == 'width') {
      this.clientpercent = this.percentage;
      setTimeout(() => this.fitwidth(), 50);
      var block;
      block = document.getElementsByClassName("select-areas-outline");
      if (block.length > 0) { setTimeout(() => this.blocksize(), 50); }

    }
    else if (this.fit == 'height') {
      setTimeout(() => this.fitheight(), 50);
    }
    else if (this.fit == 'orginalsize') {
      setTimeout(() => this.orginalsize(), 50);
    }
    else if (this.fit == 'bypercentage') {
      setTimeout(() => this.sizebypercentage(), 50);
    }

  };

  asVertical() {
    // console.log("inside asVertical of Viewer");
    this.value = 'horizontal';
    // console.log("fit: "+fit);

    this.screenview()


  }
  asHorizontal() {
    this.value = 'vertical';
    // console.log("fit inside screen Horizontal: " + this.fit);
    this.screenview()
  }



  fitheight() {
    this.clientpercent = this.percentage;
    // console.log("inside fitheight of Viewer");
    this.fit = 'height';
    var myImg;
    var falseimg;
    myImg = document.getElementById("imgToRead");
    falseimg = document.getElementById("image")
    // console.log("myImg: " + myImg);


    var divheight = document.getElementById("content").offsetHeight;
    // console.log("divelementheight " + divheight);
    myImg.style.height = divheight + "px";
    falseimg.style.height = myImg.style.height;
    var currHeight = myImg.clientHeight;
    var realHeight = myImg.naturalHeight;
    var realWidth = myImg.naturalWidth;
    this.percentage = currHeight / realHeight * 100;
    this.headerService.setpercentagevary(this.percentage);

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }

    myImg.style.width = (realWidth * this.percentage / 100) + "px";
    falseimg.style.width = myImg.style.width;
  }

  fitwidth() {
    this.clientpercent = this.percentage;
    this.fit = 'width';
    var myImg;
    var falseimg;
    myImg = document.getElementById("imgToRead");
    falseimg = document.getElementById("image")


    var divwidth = document.getElementById('content').offsetWidth;
    // console.log("divelementheight", divwidth);
    if (myImg != null) {
      myImg.style.width = divwidth + "px";
      falseimg.style.width = myImg.style.width;
      var currWidth = myImg.clientWidth;
      var realHeight = myImg.naturalHeight;
      var realWidth = myImg.naturalWidth;
      this.percentage = (currWidth / realWidth) * 100;
      this.headerService.setpercentagevary(this.percentage);

      // console.log("the current percentage is "+retain.percentage)
      //this.blocksize();

      myImg.style.height = (realHeight * this.percentage / 100) + "px";
      falseimg.style.height = myImg.style.height;
    }
  }
  orginalsize() {
    this.clientpercent = this.percentage;
    this.fit = 'orginalsize';
    var myImg;
    var falseimg;
    falseimg = document.getElementById("image")
    myImg = document.getElementById("imgToRead");
    myImg.style.width = myImg.naturalWidth + "px";

    falseimg.style.width = myImg.style.width;
    // console.log("currwidth" + myImg.naturalWidth);
    myImg.style.height = myImg.naturalHeight + "px";
    falseimg.style.height = myImg.style.height;
    // console.log("currheight" + myImg.naturalHeight);
    this.percentage = 100;
    this.headerService.setpercentagevary(this.percentage);

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }


  }
  getpercentage() {
    return this.percentage;
  }

  onZoom() {
    // this.clientpercent = this.percentage;
    this.fit = 'bypercentage';
    var myImg;
    var zoomlevel = this.percentage;
    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    var currWidth = myImg.clientWidth;
    var currHeight = myImg.clientHeight;
    myImg.style.width = (realWidth * zoomlevel / 100) + "px";
    // console.log("currwidth" + currWidth);
    myImg.style.height = (realHeight * zoomlevel / 100) + "px";
    // console.log("currheight" + currHeight);
    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;
    //  this.blocksize();
  }
  sizebypercentage() {
    var myImg;
    var zoomlevel = this.percentage;
    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;

    myImg.style.width = (realWidth * zoomlevel / 100) + "px";

    myImg.style.height = (realHeight * zoomlevel / 100) + "px";

    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;

  };

  zoomInFun() {
    this.clientpercent = this.percentage;
    this.fit = 'bypercentage';
    var myImg;
    this.percentage = this.percentage + 7.2;

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }

    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    var currWidth = myImg.clientWidth;
    var currHeight = myImg.clientHeight;
    myImg.style.width = (realWidth * this.percentage / 100) + "px";
    // console.log("currwidth" + currWidth);
    myImg.style.height = (realHeight * this.percentage / 100) + "px";
    // console.log("currheight" + currHeight);
    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;
  }

  zoomOutFun() {
    this.clientpercent = this.percentage;
    this.fit = 'bypercentage';
    var myImg;
    this.percentage = this.percentage - 7.2;

    // console.log("the current percentage is "+retain.percentage)
    var block;
    block = document.getElementsByClassName("select-areas-outline");
    if (block.length > 0) { this.blocksize(); }
    myImg = document.getElementById("imgToRead");
    var falseimg;
    falseimg = document.getElementById("image")
    var realWidth = myImg.naturalWidth;
    var realHeight = myImg.naturalHeight;
    var currWidth = myImg.clientWidth;
    var currHeight = myImg.clientHeight;
    myImg.style.width = (realWidth * this.percentage / 100) + "px";
    // console.log("currwidth" + currWidth);
    myImg.style.height = (realHeight * this.percentage / 100) + "px";
    // console.log("currheight" + currHeight);
    falseimg.style.width = myImg.style.width;
    falseimg.style.height = myImg.style.height;
  }

  rotateImage() {
    this.angle = this.angle + 0.5;
    var myImg;
    var degree = this.angle;
    myImg = document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }

  rotateImageanti() {
    this.angle = this.angle - 0.5;
    var myImg;
    var degree = this.angle;
    myImg = document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }

  onEnter() {
    var myImg;
    var degree = this.angle;
    myImg = document.getElementById("imgToRead");
    this.renderer.setStyle(
      myImg,
      'transform',
      `rotate(${degree}deg)`
    )
  }

  selectBlockservice() {
    this.obtainblock = true;
    $('img#imgToRead').selectAreas('destroy');
    let areasarray = BlockModel.blockArray.reverse();
    $('img#imgToRead').selectAreas({
      position: "absolute",
      onChanged: debugQtyAreas,
      areas: areasarray
    });

    function debugQtyAreas(event, id, areas) {
      // console.log(areas.length + " areas", arguments);
      this.displayarea = areas;
    };

    var elems = $('.select-areas-background-area');
    var len = elems.length;
    // console.log("select-areas-background-area length: " + len);
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        // console.log("elem[" + i + "]" + elems[i]);
        // console.log("elem[" + i + "]" + $('.select-areas-background-area').css("background"));
        $('.select-areas-background-area').bind();
      }
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
        // this.viewerService. selectBlockservice()
        // setTimeout(() =>  this. selectBlockservice(),.001);

      }

      $('img#imgToRead').selectAreas('destroy');
      let areasarray = BlockModel.blockArray.reverse();
      $('img#imgToRead').selectAreas({
        position: "absolute",

        areas: areasarray
      });
    }
  }



  blocknumberupdate() {
    this.clientpercent = this.percentage;
    this.blocksize()
  }
  unselectBlock() {
    this.obtainblock = false;
    $('img#imgToRead').selectAreas('destroy');

  };

  async onSave() {
    console.log("in xml save");
    var areas = $('img#imgToRead').selectAreas('areas');
    var prolog = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    var ns1 = 'http://mile.ee.iisc.ernet.in/schemas/ocr_output';
    var xmlDocument = document.implementation.createDocument(null, "page", null);
    xmlDocument.documentElement.setAttribute("xmlns", ns1);
    if (this.angle != 0) {
      xmlDocument.documentElement.setAttribute("rotationAngle", this.angle.toString());
    }
    for (let i = 0; i < areas.length; i++) {
      var blockElem = xmlDocument.createElementNS(null, "block");
      blockElem.setAttribute("type", "Text");
      var blockNumberElems = $(".select-areas-blockNumber-area");
      var blockNumber = document.getElementsByClassName('select-areas-blockNumber-area');
      blockElem.setAttribute("BlockNumber", blockNumber[(blockNumberElems.length - 1) - i].innerHTML);
      blockElem.setAttribute("SubType", "paragraphProse");
      var y = ((areas[i].y * 100) / this.percentage).toString();
      blockElem.setAttribute("rowStart", (Math.ceil(parseInt(y))).toString());
      var height = ((areas[i].height * 100) / this.percentage);
      var rowEnd = (height + parseFloat(y)).toString();
      blockElem.setAttribute("rowEnd", (Math.ceil(parseInt(rowEnd))).toString());
      var x = ((areas[i].x * 100) / this.percentage).toString();
      blockElem.setAttribute("colStart", (Math.ceil(parseInt(x))).toString());
      var width = ((areas[i].width * 100) / this.percentage);
      var colEnd = (width + parseFloat(x)).toString();
      blockElem.setAttribute("colEnd", (Math.ceil(parseInt(colEnd))).toString());
      xmlDocument.documentElement.appendChild(blockElem);
    }
    var xmlString = new XMLSerializer().serializeToString(xmlDocument);

    xml2js.parseString(xmlString, function (err, result) {
      var jsonString = JSON.stringify(result);
      XmlModel.jsonObject = result;
    });
    let fileName = this.getCurrentImageName();
    let xmlFileName = fileName.slice(0, -3) + "xml";
    this.updatelocalXml(xmlFileName, XmlModel.jsonObject);
    this.updateCorrectedXml(this.fileName);
  }


  async updatelocalXml(xmlFileName, xmlContent) {
    let revId = "";
    let xmlForm = {};
    let document = await this.currentLocalBookDbInstance.get(xmlFileName).then(function (doc) {
      return doc;
    }).catch(function (err) {
      console.log("error status", err.status);
      if (err.status == "404") {
        return "NOT_FOUND";
      }
    });

    if (document == "NOT_FOUND") {
      console.log("xmlFile was not available");
    } else {
      console.log("document from PouchDb for", document.name);
      console.log("document.LastModified", document.LastModified);
      console.log("document.revId", document._rev);
      console.log("document.revId", document._id);
      revId = document._rev;
    }
    let now = new Date();
    let date = now.toUTCString();

    console.log("date for LastModified",date,"revId for _rev",revId);
    xmlForm = {
      _id: xmlFileName,
      pageName: xmlFileName,
      data: xmlContent,
      LastModified: date,
      _rev: revId
    }

    await this.pouchService.checkDbStatus(this.currentLocalBookDbInstance).then(status => {
      console.log("status of currentLocalBookDbInstance is", status);
    });
    this.currentLocalBookDbInstance.put(xmlForm).then((result, error) => {
      console.log("result", result);
      console.log("error", error);
      if (!error) {
        console.log("Xml Pouch form saved successfully");
      }
      return true;
    });
    // this.localImagesDb = new PouchDB("mile_images_db", { revs_limit: 1, auto_compaction: true, skip_setup: true });
  }

  setDeleteImagesList(list: any) {
    this.deleteImagesList = list;
    if (this.deleteImagesList.length > 0) {
      for (let i = 0; i < this.deleteImagesList.length; i++) {
        console.log("this.deleteImagesList[" + i + "] in imageService setDeleteImagesList function", this.deleteImagesList[i]);
      }
    }
  }

  getDeleteImagesList(list: any) {
    return this.deleteImagesList;
  }

  deleteImages() {
    this.progressType = 'DELETE_IMAGES';
    if (this.deleteImagesList.length > 0) {
      var deleteImage = (x) => {
        if (x == 0) {
          this.uploadMessage = "";
          this.uploadMessageChange.emit(this.uploadMessage);
          this.progressInfos.splice(0, this.progressInfos.length);
          this.openProgressDialog();
          for (let i = 0; i < this.deleteImagesList.length; i++) {
            var status = 'Pending';
            const progress = new ProgressInfo(this.deleteImagesList[i], status);
            this.progressInfos.push(progress);
            this.progressInfoChange.emit(this.progressInfos);
          }
        }
        if (x < this.deleteImagesList.length) {
          let name = this.deleteImagesList[x];
          let bookName = this.getbookName();
          let fileName = name + "-" + bookName;
          console.log("Deleting " + fileName);
          this.progressInfos[x].value = 'Deleting';
          this.progressInfoChange.emit(this.progressInfos.slice());
          this.http.delete<{ message: string; completed: string }>(this.IMAGE_BACKEND_URL + fileName).subscribe(response => {
            console.log("response on deletion", response.message);
            if (response.completed == 'Y') {
              this.progressInfos[x].value = 'Deleted';
              this.progressInfoChange.emit(this.progressInfos.slice());
            } else {
              this.progressInfos[x].value = 'Failed';
              this.progressInfoChange.emit(this.progressInfos.slice());
            }
            this.deleteLastIndex = x;
            if (this.deleteLastIndex == (this.deleteImagesList.length - 1)) {
              this.uploadMessage = "Deletion of Images is successfull"
              this.uploadMessageChange.emit(this.uploadMessage);
              var btn = document.getElementById("pauseButton");
              btn.innerHTML = 'Ok';
            }
            if (this.deleteFlag == true) {
              deleteImage(x + 1);
            }

          });
        } else {
          this.getServerImages();
        }
      }
      if (this.deleteFlag == false) {
        this.deleteFlag = true;
        deleteImage(0);
      } else {
        deleteImage(this.deleteLastIndex);
      }
    }
  }

  setDeleteFlag(status) {
    this.deleteFlag = status;
  }

  getDeleteFlag() {
    return this.deleteFlag;
  }

  stopDeletion() {
    this.setDeleteFlag(false);
    this.deleteLastIndex = 0;
  }
}
