import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';
import { Chart } from 'chart.js/auto';
import { ApiService } from '../../../Services/api.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
    Username:string=''
    UserId:string=''
    notices: any[] = [];
    profilePictureUrl: string=''// Default
    userProfile: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,private authService: AuthService, private apiCallService:ApiService, private sanitizer: DomSanitizer,  private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.Username = this.authService.decodeToken().UserName;
    this.UserId = this.authService.decodeToken().UserId;
    let role = this.authService.decodeToken().Role;
    console.log(role);

     if (this.UserId) {
            this.loadUserProfile();
        }

    if(role=='Staff')
    {
      this.isStaff=true
      this.getServices();
      
    }
    else{
      this.getMyServiceRequests();
    }
    this.loadNotices()
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

// In your component
loadUserProfile() {
  if (!this.UserId) return;
  
  this.apiCallService.getUserProfile(this.UserId).subscribe({
    next: (profile) => {
      console.log('Profile loaded:', profile);
      this.userProfile = profile;
      
      if (profile?.profilePicturePath) {
        // Construct the direct URL
        const path = profile.profilePicturePath.startsWith('/') 
          ? profile.profilePicturePath.substring(1) 
          : profile.profilePicturePath;
        
        const imageUrl = `https://localhost:7069/${path}?t=${new Date().getTime()}`;
        console.log(imageUrl)
        this.profilePictureUrl = imageUrl
         this.cdr.detectChanges();
        
        // Sanitize the URL
        // this.profilePictureUrl = this.sanitizer.bypassSecurityTrustUrl(imageUrl);
      } else {
        this.profilePictureUrl = 'https://i.pravatar.cc/40';
      }
    },
    error: (error) => {
      console.error('Error loading profile:', error);
      this.profilePictureUrl = 'https://i.pravatar.cc/40';
    }
  });
}

// Add this test method
testImageLoad(url: string) {
  const img = new Image();
  img.onload = () => console.log('Image loaded successfully:', url);
  img.onerror = () => console.error('Image failed to load:', url);
  img.src = url;
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

  getMyServiceRequests(){
    this.apiCallService.getAllService(this.UserId).subscribe((res:any[])=>{
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

    loadNotices() {
  this.apiCallService.getNotices().subscribe({
    next: (data) => {
      this.notices = data; // Store all notices
      console.log(this.notices)
    },
    error: (error) => {
      console.error('Error fetching notices:', error);
    }
  });
}

   onImageError(event: any) {
    event.target.src = 'https://i.pravatar.cc/40'; // Fallback to default on error
  }

}
