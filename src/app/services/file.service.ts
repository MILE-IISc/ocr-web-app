import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FileService {

  constructor(private http: HttpClient) {}

  downloadFile(fileName : any): any {
      console.log("file name in file service"+fileName);
		return this.http.get(fileName, {responseType: 'blob'});
  }
}