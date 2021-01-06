
import { EventEmitter, Injectable, OnInit,Renderer2 ,RendererFactory2} from '@angular/core';
declare var $:any;
import * as $ from 'jquery';
import { BlockModel} from '../shared/block-model';
import { XmlModel,retain } from '../shared/xml-model';
import { ImageService } from '../services/images.service';
import { AuthService } from '../auth/auth.service';


@Injectable()
export class ViewerService implements OnInit{
  value:string;
  fit:string;
 public percentage:number;
 public angle:number=0;
 private renderer: Renderer2;
 public clientpercent;
 serverImages;
 fileName;
 xmlFileName;

 imgFileCount;

 constructor(private imageService: ImageService,public authService: AuthService,rendererFactory: RendererFactory2) {
     this.renderer = rendererFactory.createRenderer(null, null);
 }
  ngOnInit() {

  }

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
  this.clientpercent = this.percentage;
  console.log("inside fitheight of Viewer");
  this.fit= 'height';
  var myImg;
  var falseimg;
myImg= document.getElementById("imgToRead");
falseimg=document.getElementById("image")
console.log("myImg: "+myImg);


var divheight= document.getElementById("content").offsetHeight;
console.log("divelementheight "+divheight)
  myImg.style.height =  divheight+"px";
  falseimg.style.height= myImg.style.height;
  var currHeight = myImg.clientHeight;
  var realHeight = myImg.naturalHeight;
  var realWidth = myImg.naturalWidth;
  this.percentage=currHeight/realHeight*100;
  retain.percentage = this.percentage;
        console.log("the current percentage is "+retain.percentage)
  this.blocksize();

  myImg.style.width = (realWidth * this.percentage/100) + "px";
  falseimg.style.width = myImg.style.width;
}

fitwidth(){
  this.clientpercent = this.percentage;
  this.fit= 'width';
  var myImg;
  var falseimg;
myImg= document.getElementById("imgToRead");
falseimg=document.getElementById("image")


var divwidth = document.getElementById('content').offsetWidth;
console.log("divelementheight "+divwidth)
  myImg.style.width =  divwidth+"px";
  falseimg.style.width= myImg.style.width;
  var currWidth = myImg.clientWidth;
   var realHeight = myImg.naturalHeight;
  var realWidth = myImg.naturalWidth;
  this.percentage=(currWidth/realWidth)*100;
  retain.percentage = this.percentage;
        console.log("the current percentage is "+retain.percentage)
  this.blocksize();

  myImg.style.height = (realHeight* this.percentage/100) + "px";
  falseimg.style.height= myImg.style.height;
}
orginalsize(){
  this.clientpercent = this.percentage;
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
     retain.percentage = this.percentage;
        console.log("the current percentage is "+retain.percentage)
     this.blocksize();


}
  getpercentage(){
   return this.percentage;
}

// getpercentage(){
//   setTimeout(() => this.wait(),1000);}



  onZoom(){
    // this.clientpercent = this.percentage;

   var myImg;

   var zoomlevel= this.percentage;



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
  //  this.blocksize();
  }

  zoomInFun(){

    this.clientpercent = this.percentage;
    var myImg;
    this.percentage = this.percentage + 7.2;
    retain.percentage = this.percentage;
        console.log("the current percentage is "+retain.percentage)
    this.blocksize();



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
    this.clientpercent = this.percentage;

     var myImg;
     this.percentage = this.percentage -7.2;
     retain.percentage = this.percentage;
        console.log("the current percentage is "+retain.percentage)
     this.blocksize();



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

        this.angle=this.angle+0.5;
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
        this.angle=this.angle-0.5;
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


        var myImg;

        var degree = this.angle;
         myImg= document.getElementById("imgToRead");
        this.renderer.setStyle(
          myImg,
          'transform',
          `rotate(${degree}deg)`
        )
      }

      selectBlockservice(){
        $('img#imgToRead').selectAreas('destroy');
        console.log("inside script");
        let areasarray =  BlockModel.blockArray.reverse();
        console.log("block.model.arrray^^^^   ^^"+JSON.stringify(areasarray));




      // areasarray

        $('img#imgToRead').selectAreas({
          position:"absolute",
          onChanged : debugQtyAreas,
          areas: areasarray
        });

        function debugQtyAreas (event, id, areas) {
          console.log(areas.length + " areas", arguments);
          this.displayarea = areas;
          console.log("invoking saving to XML");
          var SaveToXML = document.getElementById("SaveToXML");
          console.log("SaveToXML: "+SaveToXML);
          SaveToXML.click();
        };



        var elems = $('.select-areas-background-area');
        var len = elems.length;
        console.log("select-areas-background-area length: "+len);
        if( len > 0) {
          for (var i = 0; i < len; i++) {
            console.log("elem["+i+"]"+elems[i]);
            console.log("elem["+i+"]"+$('.select-areas-background-area').css("background"));
            $('.select-areas-background-area').bind()
          }
        }

      }

      blocksize(){


        if(this.percentage>1){
          BlockModel.blockArray.length=0;
            var block
            block= document.getElementsByClassName("select-areas-outline");

            for (var i = 0; i < block.length; i++) {
              var blocktop = block[i].style.top;
              blocktop = blocktop.substring(0, blocktop.length - 2);
              var blockleft = block[i].style.left;
              blockleft = blockleft.substring(0, blockleft.length - 2);

              var constantfactortop = (blocktop/this.clientpercent);
              var constantfactorwidth = (block[i].clientWidth/this.clientpercent);
              var constantfactorheight = (block[i].clientHeight/this.clientpercent);
              var constantfactorleft = (blockleft/this.clientpercent);

              var id= i;
              var x=constantfactorleft*this.percentage;
              var y=constantfactortop*this.percentage;
              var width= constantfactorwidth*this.percentage;
              var height = constantfactorheight*this.percentage;
              var z =0
              var blockValue = new BlockModel(height,id,width,x,y,z);
              BlockModel.blockArray.push(blockValue);

              // this.viewerService. selectBlockservice()
              // setTimeout(() =>  this. selectBlockservice(),.001);

            }
            this. selectBlockservice()
          }

        }
        blocknumberupdate(){
          this.clientpercent = this.percentage;
          this.blocksize()

        }



    }
