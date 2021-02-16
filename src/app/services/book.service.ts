import { HttpClient } from "@angular/common/http";
import { EventEmitter, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { environment } from "../../environments/environment";
import { AuthService } from "../auth/auth.service";
import { Book } from "../shared/images.model";


@Injectable({ providedIn: "root" })
export class BookService {

    FOLDER_BACKEND_URL;
    private books: Book[] = [];
    dataUrlChange = new EventEmitter<any>();
    private booksUpdated = new Subject<{ books: Book[] }>();
    isLoading = false;
    isLoadingChange = new EventEmitter<any>();

    constructor(private http: HttpClient, private router: Router, private authService: AuthService,
    ) {
        this.FOLDER_BACKEND_URL = this.authService.BACKEND_URL + "/api/folder/";
    }

    getBooks() {
        var user = this.authService.userName;
        const queryParams = `?user=${user}`;
        this.http
            .get<{ message: string; book: any }>(
                this.FOLDER_BACKEND_URL + queryParams
            )
            .subscribe(responseData => {
                const bookListLength = responseData.book.length;
                console.log("responseData.book.length "+responseData.book.length);
                if (bookListLength > 0) {
                    this.books = responseData.book;
                    this.booksUpdated.next({
                        books: [...this.books]
                    });
                    console.log("book length in book service "+this.books.length)
                    for (let i = 0; i < this.books.length; i++) {
                        this.isLoadingChange.emit(true);
                        this.http.get<{ message: string; json: any; fileList: any }>(this.FOLDER_BACKEND_URL + this.books[i].folderName + queryParams).subscribe(responseData => {
                            this.books[i].dataUrl = responseData.json;
                            this.books[i].fileList = responseData.fileList;
                            this.isLoadingChange.emit(false);
                        });
                    }
                }
                else {
                    this.books = responseData.book;
                    this.booksUpdated.next({
                        books: []
                    });
                }

            });
    }

    getBookUpdateListener() {
        return this.booksUpdated.asObservable();

    }
}
