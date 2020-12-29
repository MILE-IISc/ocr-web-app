export class XmlModel{
  constructor(
      public unicode: string,
      public lineRowStart: number,
      public lineRowEnd: number,
      public lineColStart: number,
      public lineColEnd:number,
      public txtwidth:number,
      public txtheight:number

    ) {}

    public static textArray = [];
}

export class retain{
  public static percentage;
  public static xmlname;
  public static imgname;
}
