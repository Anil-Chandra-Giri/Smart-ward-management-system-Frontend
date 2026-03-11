import { PollOption } from "./poll-option.Model"

export interface Poll {
  id: number
  title: string
  description: string
  categoryId:string
  options: PollOption[]
}