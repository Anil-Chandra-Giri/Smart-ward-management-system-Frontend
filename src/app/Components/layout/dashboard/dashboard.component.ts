import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';
import { Chart } from 'chart.js/auto';
import { ApiService } from '../../../Services/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})



export class DashboardComponent implements AfterViewInit {
    isStaff: boolean = false;
    serviceRequests:number=0;
    pendingServices:number=0;
    approvedServices:number=0;
    rejectedServices:number=0;
    inReviewServices:number=0;
    @ViewChild('statusChart', { static: false }) statusChart?: ElementRef;
    @ViewChild('monthlyChart', { static: false }) monthlyChart?: ElementRef;

    statusChartInstance: Chart | undefined;
    monthlyChartInstance: Chart | undefined;


  constructor(@Inject(PLATFORM_ID) private platformId: Object,private authService: AuthService, private apiCallService:ApiService) {}

  ngOnInit(): void {
    let role = this.authService.decodeToken().Role;
    console.log(role);
    if(role=='Staff')
    {
      this.isStaff=true
      this.getServices();
    }
  }

  ngAfterViewInit() {

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.loadComplaintChart();
        this.loadMonthlyServiceChart();
      }, 100);
    }
  }

  loadComplaintChart(): void {
    this.apiCallService.getAllComplaints().subscribe((res: any[]) => {
      let pending = 0, inReview = 0, resolved = 0, approved=0;

      res.forEach(c => {
        if (c.status === 'Pending') pending++;
        else if (c.status === 'In Review') inReview++;
        else if (c.status === 'Resolved') resolved++;
        else if (c.status === 'Approved') approved++
      });

      if (this.statusChartInstance) {
        this.statusChartInstance.destroy();
      }

      if (this.statusChart?.nativeElement) {
        this.statusChartInstance = new Chart(this.statusChart.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Pending', 'In Review', 'Resolved', 'Approved'],
            datasets: [{
              data: [pending, inReview, resolved, approved],
              backgroundColor: ['#ff6384', '#ffcd56', '#ebeb36', '#1a0590']
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    });
  }

  loadMonthlyServiceChart(): void {
    this.apiCallService.getAllServices().subscribe((res: any[]) => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthlyCounts = new Array(12).fill(0);

      res.forEach(service => {
        const date = new Date(service.createdAt); // Make sure this matches API
        const monthIndex = date.getMonth();
        monthlyCounts[monthIndex]++;
      });

      if (this.monthlyChartInstance) {
        this.monthlyChartInstance.destroy();
      }

      if (this.monthlyChart?.nativeElement) {
        this.monthlyChartInstance = new Chart(this.monthlyChart.nativeElement, {
          type: 'bar',
          data: {
            labels: months,
            datasets: [{
              label: 'Service Requests',
              data: monthlyCounts,
              backgroundColor: '#4facfe'
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    });
  }

  getServices(){
    this.apiCallService.getAllServices().subscribe(
      (res: any[])=>{
        console.log(res);
           this.serviceRequests = res.length;

      this.pendingServices = res.filter(x => x.status === 1).length;

      this.inReviewServices = res.filter(x=>x.status === 2).length;

      this.approvedServices = res.filter(x => x.status === 3).length;

      this.rejectedServices = res.filter(x => x.status === 4).length;
      },
      err=>{
          console.log(err);
      }
    )
  }

   


  

}
