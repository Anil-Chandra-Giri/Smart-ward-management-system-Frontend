import { Component, OnInit } from '@angular/core'
import { ApiService } from '../../../../../Services/api.service'
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { Vote } from '../../../../../Models/vote.model'
import { RouterLink } from '@angular/router'

@Component({
selector:'app-citizen-poll',
templateUrl:'./poll-list.component.html',
styleUrls:['./poll-list.component.css'],
imports:[FormsModule,CommonModule,RouterLink]
})
export class PollListComponent implements OnInit{

polls:any[]=[]
showModal=false
selectedPoll:any
selectedOption!:string
errorMessage=''

constructor(private api:ApiService){}

ngOnInit(){
this.loadPolls()
}

loadPolls(){
this.api.getActivePolls().subscribe((res:any)=>{
this.polls=res;
console.log(res);
})
}

openVoteModal(poll:any){
this.selectedPoll=poll
this.selectedOption=''
this.showModal=true
}

closeModal(){
this.showModal=false
}

submitVote(){

const vote:Vote={
pollId:this.selectedPoll.id,
optionId:this.selectedOption,
citizenId:'CIT001'
}

this.api.vote(vote).subscribe({
next:()=>{
alert("Vote submitted successfully")
this.closeModal()
},
error:(err)=>{
alert(err.error?.message)
}
})

}

trackByOptionId(index: number, option: any): number {
  return option.id; // or option.id, or index if no unique id
}

}