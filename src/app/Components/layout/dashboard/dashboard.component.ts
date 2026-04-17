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
  isCitizen: boolean = false;
  isAdmin: boolean = false;
  
  // Staff & Citizen Stats
  serviceRequests: number = 0;
  pendingServices: number = 0;
  approvedServices: number = 0;
  rejectedServices: number = 0;
  inReviewServices: number = 0;
  
  // Admin Stats
  totalCitizens: number = 0;
  totalStaff: number = 0;
  totalComplaints: number = 0;
  pendingComplaints: number = 0;
  resolvedComplaints: number = 0;
  totalPolls: number = 0;
  activePolls: number = 0;
  totalServiceRequests: number = 0;
  
  @ViewChild('statusChart', { static: false }) statusChart?: ElementRef;
  @ViewChild('monthlyChart', { static: false }) monthlyChart?: ElementRef;

  statusChartInstance: Chart | undefined;
  monthlyChartInstance: Chart | undefined;
  
  Username: string = '';
  UserId: string = '';
  notices: any[] = [];
  profilePictureUrl: string = '';
  userProfile: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private apiCallService: ApiService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    try {
      const decodedToken = this.authService.decodeToken();
      if (decodedToken) {
        this.Username = decodedToken.UserName;
        this.UserId = decodedToken.UserId;
        const role = decodedToken.Role;
        
        this.isAdmin = role === 'Admin' || role === 'admin';
        this.isStaff = role === 'Staff' || role === 'staff';
        this.isCitizen = role === 'Citizen' || role === 'citizen';
        
        console.log('Dashboard - User role:', role);
        console.log('Admin:', this.isAdmin, 'Staff:', this.isStaff, 'Citizen:', this.isCitizen);
        
        if (this.UserId) {
          this.loadUserProfile();
        }
        
        // Load role-specific data
        if (this.isAdmin) {
          this.loadAdminDashboardData();
        } else if (this.isStaff) {
          this.getServices();
        } else if (this.isCitizen) {
          this.getMyServiceRequests();
        }
        
        this.loadNotices();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.loadCharts();
      }, 500);
    }
  }

  loadCharts(): void {
    if (this.isAdmin) {
      this.loadAdminCharts();
    } else {
      this.loadStaffCitizenCharts();
    }
  }

  loadAdminCharts(): void {
    // Load complaint status chart for admin
    this.apiCallService.getAllComplaints().subscribe((res: any[]) => {
      let pending = 0, resolved = 0;
      
      res.forEach(c => {
        if (c.status === 'Pending') pending++;
        else if (c.status === 'Resolved') resolved++;
      });

      if (this.statusChartInstance) {
        this.statusChartInstance.destroy();
      }

      if (this.statusChart?.nativeElement) {
        this.statusChartInstance = new Chart(this.statusChart.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Pending Complaints', 'Resolved Complaints'],
            datasets: [{
              data: [pending, resolved],
              backgroundColor: ['#f39c12', '#2ecc71']
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    });

    // Load monthly complaints chart for admin
    this.apiCallService.getAllComplaints().subscribe((res: any[]) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyCounts = new Array(12).fill(0);

      res.forEach(complaint => {
        const date = new Date(complaint.createdAt);
        const monthIndex = date.getMonth();
        monthlyCounts[monthIndex]++;
      });

      if (this.monthlyChartInstance) {
        this.monthlyChartInstance.destroy();
      }

      if (this.monthlyChart?.nativeElement) {
        this.monthlyChartInstance = new Chart(this.monthlyChart.nativeElement, {
          type: 'line',
          data: {
            labels: months,
            datasets: [{
              label: 'Monthly Complaints',
              data: monthlyCounts,
              borderColor: '#e74c3c',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    });
  }

  loadStaffCitizenCharts(): void {
    // Load complaint chart for staff/citizen
    this.apiCallService.getAllComplaints().subscribe((res: any[]) => {
      let pending = 0, inReview = 0, resolved = 0, approved = 0;

      res.forEach(c => {
        if (c.status === 'Pending') pending++;
        else if (c.status === 'In Review') inReview++;
        else if (c.status === 'Resolved') resolved++;
        else if (c.status === 'Approved') approved++;
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
              backgroundColor: ['#ff6384', '#ffcd56', '#2ecc71', '#3498db']
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    });

    // Load monthly service chart for staff/citizen
    this.apiCallService.getAllServices().subscribe((res: any[]) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyCounts = new Array(12).fill(0);

      res.forEach(service => {
        const date = new Date(service.createdAt);
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

  loadAdminDashboardData(): void {
    // Load total citizens
    this.apiCallService.getAllCitizens().subscribe({
      next: (res: any[]) => {
        this.totalCitizens = res.length;
      },
      error: (err) => console.error('Error loading citizens:', err)
    });
    
    // Load total staff
    this.apiCallService.getAllStaff().subscribe({
      next: (res: any[]) => {
        this.totalStaff = res.length;
      },
      error: (err) => console.error('Error loading staff:', err)
    });
    
    // Load complaints statistics
    this.apiCallService.getAllComplaints().subscribe({
      next: (res: any[]) => {
        this.totalComplaints = res.length;
        this.pendingComplaints = res.filter(c => c.status === 'Pending').length;
        this.resolvedComplaints = res.filter(c => c.status === 'Resolved').length;
      },
      error: (err) => console.error('Error loading complaints:', err)
    });
    
    // Load service requests statistics
    this.apiCallService.getAllServices().subscribe({
      next: (res: any[]) => {
        this.totalServiceRequests = res.length;
      },
      error: (err) => console.error('Error loading service requests:', err)
    });
    
    // Load polls statistics
    this.apiCallService.getAllPolls().subscribe({
      next: (res: any[]) => {
        this.totalPolls = res.length;
        this.activePolls = res.filter(p => p.isActive).length;
      },
      error: (err) => console.error('Error loading polls:', err)
    });
  }

  getServices(): void {
    this.apiCallService.getAllServices().subscribe(
      (res: any[]) => {
        console.log(res);
        this.serviceRequests = res.length;
        this.pendingServices = res.filter(x => x.status === 1).length;
        this.inReviewServices = res.filter(x => x.status === 2).length;
        this.approvedServices = res.filter(x => x.status === 3).length;
        this.rejectedServices = res.filter(x => x.status === 4).length;
      },
      err => {
        console.log(err);
      }
    );
  }

  getMyServiceRequests(): void {
    this.apiCallService.getAllService(this.UserId).subscribe(
      (res: any[]) => {
        this.serviceRequests = res.length;
        this.pendingServices = res.filter(x => x.status === 1).length;
        this.inReviewServices = res.filter(x => x.status === 2).length;
        this.approvedServices = res.filter(x => x.status === 3).length;
        this.rejectedServices = res.filter(x => x.status === 4).length;
      },
      err => {
        console.log(err);
      }
    );
  }

  loadUserProfile(): void {
    if (!this.UserId) return;
    
    this.apiCallService.getUserProfile(this.UserId).subscribe({
      next: (profile) => {
        console.log('Profile loaded:', profile);
        this.userProfile = profile;
        
        if (profile?.profilePicturePath) {
          const path = profile.profilePicturePath.startsWith('/') 
            ? profile.profilePicturePath.substring(1) 
            : profile.profilePicturePath;
          
          const imageUrl = `https://localhost:7069/${path}?t=${new Date().getTime()}`;
          console.log(imageUrl);
          this.profilePictureUrl = imageUrl;
          this.cdr.detectChanges();
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

  loadNotices(): void {
    this.apiCallService.getNotices().subscribe({
      next: (data) => {
        this.notices = data;
        console.log(this.notices);
      },
      error: (error) => {
        console.error('Error fetching notices:', error);
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'https://i.pravatar.cc/40';
  }
}