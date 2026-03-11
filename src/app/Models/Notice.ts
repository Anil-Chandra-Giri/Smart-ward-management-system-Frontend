export interface Notice {
  id:number
  title:string
  description:string
  category:string
  fileUrl:string
  isUrgent:boolean
  publishDate:Date
  expiryDate:Date
}