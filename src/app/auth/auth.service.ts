import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { environment } from "../../environments/environment";
import { AuthData } from "./auth-data.model";

import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: "root" })
export class AuthService {
  private isAuthenticated = false;
  private token: string;
  private tokenTimer: any;
  private userId: string;
  public userName: string;
  private isAdmin: boolean;
  private isLoaded;
  public email;
  BACKEND_URL;

  private authStatusListener = new Subject<boolean>();

  constructor(private http: HttpClient, private router: Router, @Inject(DOCUMENT) private document: Document) {
    console.log("APP_BASE_HREF "+this.document.location.origin);

      this.BACKEND_URL = this.document.location.origin + "/api/user/";
    
    console.log("BACKEND_URL "+this.BACKEND_URL);
  }

  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getUserId() {
    return this.userId;
  }

  getUserName() {
    return this.userName;
  }

  getIsAdmin() {
    return this.isAdmin;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  createUser(email: string, password: string, type: string) {
    const authData: AuthData = { email: email, password: password, type: type};
    this.http.post(this.BACKEND_URL + "/signup", authData).subscribe(
      () => {
        this.router.navigate(["/screen"]);
      },
      error => {
        this.authStatusListener.next(false);
      }
    );
  }

  login(email: string, password: string) {
    const authData: AuthData = { email: email, password: password };
    // this.email = { email: email };
    console.log("email in auth"+this.email);
    this.http
      .post<{ token: string; expiresIn: number; userId: string, email: string,type: string, isLoaded: string, files: any}>(
        this.BACKEND_URL + "/login",
        authData
      )
      .subscribe(
        response => {
          const token = response.token;
          this.token = token;
          if (token) {
            const expiresInDuration = response.expiresIn;
            this.setAuthTimer(expiresInDuration);
            this.isAuthenticated = true;
            this.userId = response.userId;
            this.userName = response.email;
            this.isAdmin = (response.type == "admin") ? true : false;
            this.isLoaded = response.isLoaded;
            this.authStatusListener.next(true);
            const now = new Date();
            const expirationDate = new Date(
              now.getTime() + expiresInDuration * 1000
            );
            this.saveAuthData(token, expirationDate, this.userId, this.userName, this.isAdmin);
            this.router.navigate(["/screen"]);
          }
        },
        error => {
          this.authStatusListener.next(false);
        }
      );
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      return;
    }
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation.token;
      this.isAuthenticated = true;
      this.userId = authInformation.userId;
      this.userName = authInformation.userName;
      this.isAdmin = authInformation.isAdmin;
      this.setAuthTimer(expiresIn / 1000);
      this.authStatusListener.next(true);
      this.router.navigate(["/screen"]);
    }
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    this.userId = null;
    this.userName = null;
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(["/auth/login"]);
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string, userName: string, isAdmin) {
    localStorage.setItem("token", token);
    localStorage.setItem("expiration", expirationDate.toISOString());
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    localStorage.setItem("isAdmin", isAdmin);
  }

  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("isAdmin");
  }

  private getAuthData() {
    const token = localStorage.getItem("token");
    const expirationDate = localStorage.getItem("expiration");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const isAdmin = JSON.parse(localStorage.getItem("isAdmin"));
    if (!token || !expirationDate) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId,
      userName: userName,
      isAdmin: isAdmin
    };
  }
}
