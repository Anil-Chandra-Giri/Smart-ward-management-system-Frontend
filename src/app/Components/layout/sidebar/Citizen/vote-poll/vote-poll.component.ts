import { Component,OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ApiService } from '../../../../../Services/api.service'
import { Vote } from '../../../../../Models/vote.model'
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'

@Component({
selector:'app-vote-poll',
templateUrl:'./vote-poll.component.html',
imports:[FormsModule,CommonModule]
})
export class VotePollComponent implements OnInit{

pollId!:string
selectedOption!:string
poll:any
options:any[]=[]
constructor(
private route:ActivatedRoute,
private pollService:ApiService
){}

ngOnInit(){
  this.loadPoll();
this.pollId=this.route.snapshot.paramMap.get('id')!
}

loadPoll(){

  this.pollService.getActivePolls()
  .subscribe((res:any)=>{

   this.poll = res.find((p:any)=>p.id === this.pollId)
    console.log(res);
   if(this.poll){
    this.options = this.poll.options
   }

  })

 }

vote(){

const vote:Vote={
pollId:this.pollId,
optionId:this.selectedOption,
citizenId:'CIT001'
}

this.pollService.vote(vote).subscribe(res=>{
alert("Vote submitted")
},
err=>{
  alert(err.error?.message);
}

)

}

}