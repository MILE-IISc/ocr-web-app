import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import { ImageService } from 'src/app/services/images.service';
import { ProgressInfo } from "src/app/shared/images.model";

@Component({
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProgressDialogComponent implements OnInit {

  resume = false;

  constructor(private imageService: ImageService, public dialog: MatDialog){}

    progressInfos:ProgressInfo[] =[];

  ngOnInit(){
    this.progressInfos = this.imageService.getProgressInfos();
      this.imageService.progressInfoChange.subscribe((progressInfos: ProgressInfo[])=>{
        this.progressInfos = progressInfos;
      });
      // console.log("progress info length in screen =========="+this.progressInfos.length);
  }

  pauseOcrRun(){
    var btn = document.getElementById("pauseButton");
    if(this.resume == false){
      btn.innerHTML = 'Resume';
      let progressType = this.imageService.getProgressType();
      if(progressType == 'UPLOAD_IMAGE'){
        this.imageService.setUploadImageFlag(false);
      }else if(progressType == 'RUN_OCR'){
        this.imageService.setRunOcrAllFlag(false);
      }

    }
    else if(this.resume == true){
      this.resume = true;
      btn.innerHTML = 'Pause';
      let progressType = this.imageService.getProgressType();
      if(progressType == 'UPLOAD_IMAGE'){
        this.imageService.setUploadImageFlag(true);
        this.imageService.resumeUploadImages();
      }else if(progressType == 'RUN_OCR'){
        this.imageService.setRunOcrAllFlag(true);
        this.imageService.getXmlFileAsJson2();
      }

    }
    this.resume = !this.resume;
  }

  cancel() {
    const dialogRef = this.dialog.open(confirmationDialog, {
      disableClose: true,
      width: '450px',
      panelClass: 'my-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
    });
  }

}


@Component({
  selector: 'confirmation-dialog',
  templateUrl: './confirmation.dialog.html',
  styleUrls: ['./progress-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class confirmationDialog implements OnInit{

  dialogInfo = "";
  header = "";
  constructor(private imageService: ImageService) { }

  ngOnInit(): void {
    let progressType = this.imageService.getProgressType();
    // console.log("progressType|"+progressType+"|");
    if (progressType == 'UPLOAD_IMAGE') {
      this.header = "Terminate Upload Image Operation";
      this.dialogInfo = "Confirm whether to cancel upload of rest of the images. Are you sure you want to continue? ";
      // console.log("dialog header", this.header,"dialog message",this.dialogInfo);
    } else if (progressType == 'RUN_OCR') {
      this.header = "Terminate RUN-OCR Operation";
      this.dialogInfo = "Confirm whether to cancel running OCR on rest of the pages. Are you sure you want to continue? ";
      // console.log("dialog header", this.header,"dialog message",this.dialogInfo);
    }
  }


  stopOperation() {
    let progressType = this.imageService.getProgressType();
    // console.log("progressType|"+progressType+"|");
    if (progressType == 'UPLOAD_IMAGE') {
      this.imageService.stopUploadImage();
    } else if (progressType == 'RUN_OCR') {
      this.imageService.stopRunOcrOnAll();
    }
  }
}
