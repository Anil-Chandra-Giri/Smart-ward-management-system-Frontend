import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PollCategory } from '../../../../../Models/poll-category';
import { ApiService } from '../../../../../Services/api.service';

@Component({
  selector: 'app-poll-management',
  imports: [FormsModule,CommonModule],
  templateUrl: './poll-management.component.html',
  styleUrl: './poll-management.component.css'
})
export class PollManagementComponent implements OnInit{

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
