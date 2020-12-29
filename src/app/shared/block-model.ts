export class BlockModel{
  constructor(
      public height: number,
      public id: number,
      public width: number,
      public x: number,
      public y:number,
      public z:number

    ) {}

    public static blockArray = [];
}
