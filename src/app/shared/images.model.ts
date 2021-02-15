export class Images {
  constructor(
    public _id: any,
    public fileName: any,
    public completed: string,
    public editor: string,
    public dataUrl: any
  ) { }
}

export class ProgressInfo {
  constructor(
    public fileName: any,
    public value: any
  ) { }
}

export class Book {
  constructor(
    public fileList: any,
    public folderName: string,
    public dataUrl:string
  ) { }
}