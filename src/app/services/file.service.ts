import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class FileService {
  XML_BACKEND_URL;
  DOWNLOAD_XML_BACKEND_URL;
  constructor(private http: HttpClient, private authService: AuthService) {
    this.XML_BACKEND_URL = this.authService.BACKEND_URL + "/api/xml/";
    this.DOWNLOAD_XML_BACKEND_URL = this.authService.BACKEND_URL + "/api/downloadXml/";
  }

  downloadFile(fileName: any) {
    console.log("fileName in download XML", fileName);
    return this.http.get<{ message: string; xmlData: any }>(this.XML_BACKEND_URL + fileName).toPromise();
  }

  downloadZipFile() {
    const options: any = {
      header: new HttpHeaders({'Content_Type': 'application/octet-stream'}),
      responseType: 'blob'
    };
    return this.http.get(this.DOWNLOAD_XML_BACKEND_URL, options).toPromise();
  }
}
