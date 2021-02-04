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
      this.imageService.setRunOcrAllFlag(false);
    }
    else if(this.resume == true){
      this.resume = true;
      btn.innerHTML = 'Pause';
      this.imageService.setRunOcrAllFlag(true);
      this.imageService.getXmlFileAsJson2();
    }
    this.resume = !this.resume;
  }

  cancelOcrRun() {
    const dialogRef = this.dialog.open(runOcrConfirmationDialog, {
      disableClose: true,
      width: '450px',
      panelClass: 'my-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

}


@Component({
  selector: 'run-ocr-confirmation-dialog',
  templateUrl: './runOcrConfirmation.dialog.html',
  styleUrls: ['./progress-dialog.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class runOcrConfirmationDialog {
  constructor(private imageService: ImageService){}

  stopOcrRun() {
    this.imageService.stopRunOcrOnAll();
}

}
