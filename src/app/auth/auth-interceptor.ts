import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler
} from "@angular/common/http";
import { Injectable } from "@angular/core";

import { AuthService } from "./auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const authToken = this.authService.getToken();
    const bucketName = this.authService.getbucketName();
    var authRequest;
    if(bucketName == null || bucketName == "") {
      authRequest = req.clone({
        headers: req.headers.set("Authorization", "Bearer " + authToken)
      });
    }
    else {
      authRequest = req.clone({
        headers: req.headers.set("bucketName", bucketName).set("Authorization", "Bearer " + authToken)
      });
    }
    return next.handle(authRequest);
  }
}
