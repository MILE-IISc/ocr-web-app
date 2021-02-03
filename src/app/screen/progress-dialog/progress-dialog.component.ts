import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ImageService } from 'src/app/services/images.service';
import { ProgressInfo } from "src/app/shared/images.model";

@Component({
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProgressDialogComponent implements OnInit {

  constructor(private imageService: ImageService){}
  
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
    if(btn.innerHTML == 'Pause'){
      btn.innerHTML = 'Resume'
    }else{
      btn.innerHTML = 'Pause'
    }
  }

}
