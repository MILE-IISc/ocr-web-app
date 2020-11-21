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
