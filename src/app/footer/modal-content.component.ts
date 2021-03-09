import { Component, OnInit ,EventEmitter} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { XmlModel,WordModel } from '../shared/xml-model';
import { ImageService } from '../services/images.service';
import { HeaderService } from '../services/header.service';

import * as $ from 'jquery';

@Component({
  selector: 'modal-content',
  templateUrl: './modal-content.component.html',
  styleUrls: ['./modal-content.component.scss'],
})

export class ModalContentComponent implements OnInit {


  unicode;
  // WordArray = [];
  WordArray: any = WordModel.WordArray;
  localUrl;
  WordImageUrl;
  lineNumber;
  blkcount = 0
  imgFileCount = 0;
  percentage;
  linecount = 0
  count = 0;
  countChange = new EventEmitter<Number>();
  fileName



  constructor(private dialogRef: MatDialogRef<ModalContentComponent>, private imageService: ImageService, private headerService: HeaderService) { }

  closeDialog(): void {
    this.dialogRef.close();
  }

  async ngOnInit() {
    var blocks = XmlModel.jsonObject['page'].block;
    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      if (block.line) {
        var lines = block.line;
        for (var l = 0; l < lines.length; l++) {
          var line = lines[l];
          if (line.word) {
            var lineText = "";
            var words = line.word;
            for (var w = 0; w < words.length; w++) {
              var wordText = words[w]["$"].unicode;

              var wordRowStart = words[w]["$"].rowStart;
              var wordRowEnd = words[w]["$"].rowEnd;
              var wordColStart = words[w]["$"].colStart;
              var wordColEnd = words[w]["$"].colEnd;
              var wordNumber = words[w]["$"].WordNumber;
              var lineNumber = line["$"].LineNumber;
              var wordwidth = wordColEnd - wordColStart + 1;
              var wordheight = wordRowEnd - wordRowStart + 1;

              if (wordText != null) {
                lineText += " " + wordText;
                var unicode = words[w]["$"].unicode
                console.log("unicode"+unicode)
                var wordInfo = new WordModel(unicode,wordRowStart,wordRowEnd,wordColStart,wordColEnd,wordwidth,wordheight,wordNumber);
                WordModel.WordArray.push(wordInfo);
                WordModel.WordArray.slice(0,  WordModel.WordArray.length);
              }
            }
          }
        }
      }
    }
    console.log("wordArrayLEngth"+ WordModel.WordArray.length);
    this.percentage = this.headerService.getpercentagevary();
    this.headerService.percentageChange.subscribe((percent: number) => {
      this.percentage = percent;

    });
     this.setWord(this.count);

  }

  setWord(count) {
    var srcImg = document.getElementById("imgToRead") as HTMLImageElement;
    var srcheight = srcImg.style.height;
    var srcWidth = srcImg.style.width;
    var source = srcImg.src
    var img = document.getElementById("ImgWord") as HTMLImageElement;
    img.src = source;
    // var wordInfo = new WordModel(unicode,wordRowStart,wordRowEnd,wordColStart,wordColEnd,wordwidth,wordheight,wordNumber);
    var WordArray = WordModel.WordArray
    // console.log("WordArray" + WordArray.length)
    this.unicode =WordArray[count].unicode;
    // console.log("unicode" + this.unicode);
    var wordNumber = WordArray[count].wordNumber;
    // console.log("wordNumber"+wordNumber)
    var wordRowStart = WordArray[count].wordRowStart;
    // console.log("wordRowStart"+wordRowStart)
    var wordRowEnd = WordArray[count].wordRowEnd;
    // console.log("wordRowEnd",wordRowEnd)
    var wordColStart =WordArray[count].wordColStart;
    // console.log("wordColStart",wordColStart)
    var wordColEnd = WordArray[count].wordColEnd
    // console.log("worcolENd"+wordColEnd)
     var Left = wordColStart * this.percentage / 100;
    var Top = wordRowStart * this.percentage / 100;
    var Right = wordColEnd * this.percentage / 100
    var Bottom = wordRowEnd * this.percentage / 100
    var WordTop = (Top * 700) / parseFloat(srcheight) + "px"
    var wordBottom = (700 - (Bottom * 700) / parseFloat(srcheight)) + "px"
    var WordLeft = (Left * 500) / parseFloat(srcWidth) + "px"
    var WordRight =(500 - (Right * 500) / parseFloat(srcWidth)) + "px"

    var clippi = WordTop + ' ' + WordRight + ' ' + wordBottom + ' ' + WordLeft;
    console.log("clippi",clippi)
    /* Example: clip away the element from the top, right, bottom, and left edges */
    img.style.clipPath = "inset(" + clippi + ")";
  }

OnEnter(event) {
  // console.log("enter")
  this.nextWordCorrect();
  this.updateUnicode();
 }

  previousWordCorrect() {
    console.log("previousWordCorrect");
    this.count = this.count - 1;
    this.countChange.emit(this.count)
    this.setWord(this.count)
 }
  nextWordCorrect() {
    console.log("nextWordCorrect")
    this.count = this.count + 1;
    this.countChange.emit(this.count);
     this.setWord(this.count);
     }
     updateUnicode(){
      var txt = document.getElementsByClassName('txtWord')
      console.log("txt.length"+txt.length)
      var blk = XmlModel.jsonObject['page'].block;
        console.log("blk",blk);
        console.log("blkLength",blk.length)
        for(var i=0;i<blk.length;i++){
          if(blk[i].line){

          var lines = blk[i].line;
            for(var j=0;j<lines.length;j++){
              if(lines[j].word){
                var words = lines[j].word;
                console.log("words length",words.length)

              }
            }
          }
        }
        this.fileName = this.imageService.getCurrentImageName();
         this.imageService.updateCorrectedXml(this.fileName);

     }
}
