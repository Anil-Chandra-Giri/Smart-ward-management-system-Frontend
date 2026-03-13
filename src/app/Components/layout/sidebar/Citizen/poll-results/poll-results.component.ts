import { Component,OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import Chart from 'chart.js/auto'
import { ApiService } from '../../../../../Services/api.service'

@Component({
selector:'app-poll-results',
templateUrl:'./poll-results.component.html'
})
export class PollResultsComponent implements OnInit{

pollId!:string

constructor(
private route:ActivatedRoute,
private pollService:ApiService
){}

ngOnInit(){

this.pollId=this.route.snapshot.paramMap.get('id')!
this.pollService.getResults(this.pollId)
.subscribe((res:any)=>{
const labels=res.map((x:any)=>x.option);
const data=res.map((x:any)=>x.votes);
new Chart("chart",{
type:'bar',
data:{
labels:labels,
datasets:[{
label:'Votes',
data:data
}]
}
})

})}}



