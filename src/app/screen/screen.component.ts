import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';


@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css']
})
export class ScreenComponent implements OnInit {
  title = 'Layout';
  

  constructor() { }

  ngOnInit(): void {
  }selectedImage: string;
  anotherTryVisible: boolean;
  localUrl: any[];

  
  importFile(event) {
    this.anotherTryVisible = true;
    if (event.target.files && event.target.files[0]) {
            var reader = new FileReader();
            reader.onload = (event: any) => {
                this.localUrl = event.target.result;
            }
            reader.readAsDataURL(event.target.files[0]);
    }
}

  

drag(){
  var isResizing = false;
  $(function () {
    var container = $('#wrapper'),
        left = $('#imageForOCR'),
        right = $('#textFromOCR'),
        handle = $('#grabber');

    handle.on('mousedown', function (e) {
        isResizing = true;
        lastDownX = e.clientX;
    });

    $(document).on('mousemove', function (e) {
        // we don't want to do anything if we aren't resizing.
        if (!isResizing)
            return;

        var offsetRight = container.width() - (e.clientX - container.offset().left);
        left.css('right', offsetRight);
        right.css('width', offsetRight);

    }).on('mouseup', function (e) {
        // stop resizing
        isResizing = false;
    });
    //$( "#imageForOCR" ).resizable({ ghost: true });
})

}
  zoomInFun(){
    var myImg = document.getElementById("imgToRead");
  var currWidth = myImg.clientWidth;
  if (currWidth == 2500) return false;
  else {
    myImg.style.width = (currWidth + 100) + "px";
  }
  }

  zoomOutFun(){
    var myImg = document.getElementById("imgToRead");
  var currWidth = myImg.clientWidth;
  if (currWidth == 100) return false;
  else {
    myImg.style.width = (currWidth - 100) + "px";
  }
  }
}

declare var lastDownX: number;



