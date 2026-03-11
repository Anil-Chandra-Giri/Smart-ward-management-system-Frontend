import { Component,OnInit } from '@angular/core'
import { ApiService } from '../../../../../Services/api.service'
import { PollCategory } from '../../../../../Models/poll-category'
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'

@Component({
selector:'app-create-poll',
templateUrl:'./create-poll.component.html',
styleUrls:['./create-poll.component.css'],
imports:[FormsModule,CommonModule]
})
export class CreatePollComponent implements OnInit{

title=''
description=''
categoryId!:number

categories:PollCategory[]=[]

showCategoryInput=false
newCategoryName=''

options:string[]=['','']

constructor(private pollService:ApiService){}

ngOnInit(){
this.loadCategories()
}

loadCategories(){
this.pollService.getPollCategories()
.subscribe(res=>{
this.categories=res
})
}

addOption(){
this.options.push('')
}

createCategory(){

this.pollService.createPollCategory(this.newCategoryName)
.subscribe(()=>{

this.newCategoryName=''
this.showCategoryInput=false
this.loadCategories()

})

}

createPoll(){

const data={
title:this.title,
description:this.description,
categoryId:this.categoryId,
startDate:new Date(),
options:this.options
}

this.pollService.createPoll(data)
.subscribe(()=>{
alert("Poll created")
})

}

}