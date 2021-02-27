import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { environment } from "../../environments/environment";
import { AuthData } from "./auth-data.model";

import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PouchService } from "../services/pouch.service";

@Injectable({ providedIn: "root" })
export class AuthService {
  private isAuthenticated = false;
  private token: string;
  private bucketName: string;
  private tokenTimer: any;
  private userId: string;
  public userName: string;
  private isAdmin: boolean;
  private isLoaded;
  public email;
  public BACKEND_URL;
  private AUTH_BACKEND_URL;

  // Pouch & Couch related details
  public userDb: string;
  private userDbKey: string;
  private userDbPwd: string;

  private authStatusListener = new Subject<boolean>();

  constructor(private http: HttpClient, private router: Router, @Inject(DOCUMENT) private document: Document, private pouchService: PouchService) {
    console.log("APP_BASE_HREF "+this.document.location.origin);
    this.BACKEND_URL = this.document.location.origin;
    this.AUTH_BACKEND_URL = this.BACKEND_URL+ "/api/user/";
    console.log("AUTH_BACKEND_URL "+this.AUTH_BACKEND_URL);
  }

  getToken() {
    return this.token;
  }

  getbucketName() {
    return this.bucketName;
  }

  getUserDbDetails() {
    let userDbDetails = {
      "userDb": this.userDb,
      "userDbKey": this.userDbKey,
      "userDbPwd": this.userDbPwd,
    }
    return userDbDetails;
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

  createUser(email: string, password: string, role: string) {
    const authData: AuthData = { email: email, password: password, role: role};
    this.http.post(this.AUTH_BACKEND_URL + "/signup", authData).subscribe(
      () => {
        this.router.navigate(["/booksdashboard"]);
      },
      error => {
        this.authStatusListener.next(false);
      }
    );
  }

  login(email: string, password: string) {
    const authData: AuthData = { email: email, password: password };
    this.http
      .post<{ token: string; expiresIn: number; userId: string, email: string, role: string, isLoaded: string, bucketName: string, userDb: string, userDbKey: string, userDbPwd: string}>(
        this.AUTH_BACKEND_URL + "/login",
        authData
      ).subscribe(
        async (response) => {
          const token = response.token;
          this.token = token;
          if (token) {
            const expiresInDuration = response.expiresIn;
            this.setAuthTimer(expiresInDuration);
            this.isAuthenticated = true;
            this.userId = response.userId;
            this.userName = response.email;
            this.isAdmin = (response.role == "admin") ? true : false;
            this.isLoaded = response.isLoaded;
            this.bucketName = response.bucketName;
            this.userDb = response.userDb;
            this.userDbKey = response.userDbKey;
            this.userDbPwd = response.userDbPwd;
            this.authStatusListener.next(true);
            const now = new Date();
            const expirationDate = new Date(
              now.getTime() + expiresInDuration * 1000
            );
            this.saveAuthData(token, expirationDate, this.userId, this.userName, this.isAdmin, this.bucketName, this.userDb, this.userDbKey, this.userDbPwd);
            this.router.navigate(["/booksdashboard"]);
          }
        },
        error => {
          this.authStatusListener.next(false);
          console.log("error while login ",error);
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
      this.bucketName = authInformation.bucketName;
      this.userDb = authInformation.userDb;
      this.userDbKey = authInformation.userDbKey;
      this.userDbPwd = authInformation.userDbPwd;
      this.isAdmin = authInformation.isAdmin;
      this.setAuthTimer(expiresIn / 1000);
      this.authStatusListener.next(true);
      this.router.navigate(["/booksdashboard"]);
    }
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    this.userId = null;
    this.userName = null;
    this.bucketName = null;
    this.userDb = null;
    this.userDbKey = null;
    this.userDbPwd = null;
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(["/auth/login"]);
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string, userName: string, isAdmin, bucketName: string, userDb: string, userDbKey: string, userDbPwd: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("expiration", expirationDate.toISOString());
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    localStorage.setItem("isAdmin", isAdmin);
    localStorage.setItem("bucketName", bucketName);
    localStorage.setItem("userDb", userDb);
    localStorage.setItem("userDbKey", userDbKey);
    localStorage.setItem("userDbPwd", userDbPwd);
  }

  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("bucketName");
    localStorage.removeItem("userDb");
    localStorage.removeItem("userDbKey");
    localStorage.removeItem("userDbPwd");
  }

  private getAuthData() {
    const token = localStorage.getItem("token");
    const expirationDate = localStorage.getItem("expiration");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const bucketName = localStorage.getItem("bucketName");
    const userDb = localStorage.getItem("userDb");
    const userDbKey = localStorage.getItem("userDbKey");
    const userDbPwd = localStorage.getItem("userDbPwd");
    const isAdmin = JSON.parse(localStorage.getItem("isAdmin"));
    if (!token || !expirationDate) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId,
      userName: userName,
      isAdmin: isAdmin,
      bucketName: bucketName,
      userDb: userDb,
      userDbKey: userDbKey,
      userDbPwd: userDbPwd
    };
  }
}
