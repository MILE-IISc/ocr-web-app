
import { EventEmitter, Injectable, OnInit,Renderer2 ,RendererFactory2} from '@angular/core';

@Injectable()
export class ViewerService implements OnInit{
  value:string;
  fit:string;
 public percentage:number;
 public angle:number=0;
 private renderer: Renderer2;

 constructor(rendererFactory: RendererFactory2) {
     this.renderer = rendererFactory.createRenderer(null, null);
 }
  ngOnInit() {}

asVertical(){
  console.log("inside asVertical of Viewer");
  this.value='horizontal';
  // console.log("fit: "+fit);

  if(this.fit =='width'){
 setTimeout(() => this.fitwidth(),50);}
 else if(this.fit=='height'){
 setTimeout(() => this.fitheight(),50);}
 else if (this.fit=='orginalsize'){
 setTimeout(() => this.orginalsize(),50);}


}
asHorizontal(){
  this.value='vertical';
  console.log("fit inside screen Horizontal: "+this.fit);
  if(this.fit =='width'){
    setTimeout(() => this.fitwidth(),50);}
    else if(this.fit=='height'){
    setTimeout(() => this.fitheight(),50);}
    else if (this.fit=='orginalsize'){
    setTimeout(() => this.orginalsize(),50);}
}



fitheight(){
  console.log("inside fitheight of Viewer");
  this.fit= 'height';
  var myImg;
  var falseimg;
myImg= document.getElementById("imgToRead");
falseimg=document.getElementById("image")
console.log("myImg: "+myImg);


  myImg.style.height = 100+"%";
  falseimg.style.height= myImg.style.height;
  var currHeight = myImg.clientHeight;
  var realHeight = myImg.naturalHeight;
  var realWidth = myImg.naturalWidth;
  this.percentage=currHeight/realHeight*100;
  myImg.style.width = (realWidth * this.percentage/100) + "px";
  falseimg.style.width = myImg.style.width;
}

fitwidth(){
  this.fit= 'width';
  var myImg;
  var falseimg;
myImg= document.getElementById("imgToRead");
falseimg=document.getElementById("image")


  myImg.style.width = 100+"%";
  falseimg.style.width= myImg.style.width;
  var currWidth = myImg.clientWidth;
   var realHeight = myImg.naturalHeight;
  var realWidth = myImg.naturalWidth;
  this.percentage=(currWidth/realWidth)*100;
  myImg.style.height = (realHeight* this.percentage/100) + "px";
  falseimg.style.height= myImg.style.height;
}
orginalsize(){
  this.fit='orginalsize';
 var myImg;
 var falseimg;
 falseimg=document.getElementById("image")
 myImg= document.getElementById("imgToRead");
 myImg.style.width = myImg.naturalWidth+"px";
 falseimg.style.width = myImg.style.width;
     console.log("currwidth"+myImg.naturalWidth)
     myImg.style.height = myImg.naturalHeight+ "px";
     falseimg.style.height= myImg.style.height;
     console.log("currheight"+myImg.naturalHeight)
     this.percentage=100;

}
  getpercentage(){
   return this.percentage;
}

// getpercentage(){
//   setTimeout(() => this.wait(),1000);}



  onZoom(){

   var myImg;

   var zoomlevel= this.percentage

   myImg= document.getElementById("imgToRead");
   var falseimg;
   falseimg=document.getElementById("image")
   var realWidth = myImg.naturalWidth;
 var realHeight = myImg.naturalHeight;


 var currWidth = myImg.clientWidth;
 var currHeight = myImg.clientHeight;

   myImg.style.width = (realWidth * zoomlevel/100) + "px";
   console.log("currwidth"+currWidth)
   myImg.style.height = (realHeight * zoomlevel/100) + "px";
   console.log("currheight"+currHeight)
   falseimg.style.width = myImg.style.width;
   falseimg.style.height= myImg.style.height;

  }

  zoomInFun(){

    var myImg;
    this.percentage = this.percentage + 7.2;


       myImg= document.getElementById("imgToRead");
       var falseimg;
         falseimg=document.getElementById("image")
       var realWidth = myImg.naturalWidth;
     var realHeight = myImg.naturalHeight;


     var currWidth = myImg.clientWidth;
     var currHeight = myImg.clientHeight;

       myImg.style.width = (realWidth * this.percentage/100) + "px";
       console.log("currwidth"+currWidth)
       myImg.style.height = (realHeight * this.percentage/100) + "px";
       console.log("currheight"+currHeight)
       falseimg.style.width = myImg.style.width;
        falseimg.style.height= myImg.style.height;
     }

   zoomOutFun(){

     var myImg;
     this.percentage = this.percentage -7.2;


        myImg= document.getElementById("imgToRead");
        var falseimg;
             falseimg=document.getElementById("image")
        var realWidth = myImg.naturalWidth;
      var realHeight = myImg.naturalHeight;


      var currWidth = myImg.clientWidth;
      var currHeight = myImg.clientHeight;

        myImg.style.width = (realWidth * this.percentage/100) + "px";
        console.log("currwidth"+currWidth)
        myImg.style.height = (realHeight * this.percentage/100) + "px";
        console.log("currheight"+currHeight)
        falseimg.style.width = myImg.style.width;
         falseimg.style.height= myImg.style.height;
      }
      rotateImage()
      {
        this.angle++;
      var myImg;

        var degree = this.angle;
         myImg= document.getElementById("imgToRead");
        this.renderer.setStyle(
          myImg,
          'transform',
          `rotate(${degree}deg)`
        )
      }
      rotateImageanti()
      {
        this.angle--;
      var myImg;

        var degree = this.angle;
         myImg= document.getElementById("imgToRead");
        this.renderer.setStyle(
          myImg,
          'transform',
          `rotate(${degree}deg)`
        )
      }
      onEnter() {
        // this.angle = value;
        // this.viewerService.angle = this.angle;
        // this.viewerService.onEnter();
        var myImg;

        var degree = this.angle;
         myImg= document.getElementById("imgToRead");
        this.renderer.setStyle(
          myImg,
          'transform',
          `rotate(${degree}deg)`
        )
      }



// setTimeout(() => this.orginalsize(),50);}

    }
