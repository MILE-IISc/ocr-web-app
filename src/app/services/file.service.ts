import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class FileService {
  XML_BACKEND_URL;
  DOWNLOAD_XML_BACKEND_URL;
  constructor(private httpClient: HttpClient, private authService: AuthService) {
    this.XML_BACKEND_URL = this.authService.BACKEND_URL + "/api/xml/";
    this.DOWNLOAD_XML_BACKEND_URL = this.authService.BACKEND_URL + "/api/downloadXml/";
  }

  downloadFile(fileName: any) {
    console.log("fileName in download XML", fileName);
    return this.httpClient.get<{ message: string; xmlData: any }>(this.XML_BACKEND_URL + fileName).toPromise();
  }

  downloadZipFile() {
    const options: any = {
      header: new HttpHeaders({
        'Content_Type': 'application/json',
        'Accept': 'application/json'
      }),
      responseType: 'blob' as 'json'
    };
    return this.httpClient.get<Blob>(this.DOWNLOAD_XML_BACKEND_URL, options).toPromise();
  }
}
