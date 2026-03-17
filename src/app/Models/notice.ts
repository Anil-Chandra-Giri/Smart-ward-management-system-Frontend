export class Notice {
  constructor(
    public id: number,
    public title: string,
    public description: string,
    public category: string,
    public fileUrl: string,
    public isUrgent: boolean,
    public publishDate: Date,
    public expiryDate: Date
  ) {}
}