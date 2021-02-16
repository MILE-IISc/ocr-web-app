export class XmlModel{
  constructor(
      public unicode: string,
      public lineRowStart: number,
      public lineRowEnd: number,
      public lineColStart: number,
      public lineColEnd:number,
      public txtwidth:number,
      public txtheight:number,
      public lineNumber:number,
      public blockNumber:number
    ) {}

    public static textArray = [];
    public static jsonObject;
}

export class retain{
  public static percentage;
  public static xmlname;
  public static imgname;
}
export class WordModel{
  constructor(
    public unicode: string,
    public wordRowStart: number,
    public wordRowEnd: number,
    public wordColStart: number,
    public wordColEnd:number,
    public wordwidth:number,
    public wordheight:number,
    public wordNumber:number,


  
  ){}
  public static WordArray = [];
 

}