
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
myImg= document.getElementById("imgToRead");
console.log("myImg: "+myImg);


  myImg.style.height = 100+"%";
  var currHeight = myImg.clientHeight;
  var realHeight = myImg.naturalHeight;
  var realWidth = myImg.naturalWidth;
  this.percentage=currHeight/realHeight*100;
  myImg.style.width = (realWidth * this.percentage/100) + "px";
}

fitwidth(){
  this.fit= 'width';
  var myImg;
myImg= document.getElementById("imgToRead");


  myImg.style.width = 100+"%";
  var currWidth = myImg.clientWidth;
   var realHeight = myImg.naturalHeight;
  var realWidth = myImg.naturalWidth;
  this.percentage=(currWidth/realWidth)*100;
  myImg.style.height = (realHeight* this.percentage/100) + "px";
}
orginalsize(){
  this.fit='orginalsize';
 var myImg;
 myImg= document.getElementById("imgToRead");
 myImg.style.width = myImg.naturalWidth+"px";
     console.log("currwidth"+myImg.naturalWidth)
     myImg.style.height = myImg.naturalHeight+ "px";
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
   var realWidth = myImg.naturalWidth;
 var realHeight = myImg.naturalHeight;


 var currWidth = myImg.clientWidth;
 var currHeight = myImg.clientHeight;

   myImg.style.width = (realWidth * zoomlevel/100) + "px";
   console.log("currwidth"+currWidth)
   myImg.style.height = (realHeight * zoomlevel/100) + "px";
   console.log("currheight"+currHeight)

  }

  zoomInFun(){

    var myImg;
    this.percentage = this.percentage + 7.2;


       myImg= document.getElementById("imgToRead");
       var realWidth = myImg.naturalWidth;
     var realHeight = myImg.naturalHeight;


     var currWidth = myImg.clientWidth;
     var currHeight = myImg.clientHeight;

       myImg.style.width = (realWidth * this.percentage/100) + "px";
       console.log("currwidth"+currWidth)
       myImg.style.height = (realHeight * this.percentage/100) + "px";
       console.log("currheight"+currHeight)
     }

   zoomOutFun(){

     var myImg;
     this.percentage = this.percentage -7.2;


        myImg= document.getElementById("imgToRead");
        var realWidth = myImg.naturalWidth;
      var realHeight = myImg.naturalHeight;


      var currWidth = myImg.clientWidth;
      var currHeight = myImg.clientHeight;

        myImg.style.width = (realWidth * this.percentage/100) + "px";
        console.log("currwidth"+currWidth)
        myImg.style.height = (realHeight * this.percentage/100) + "px";
        console.log("currheight"+currHeight)
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
