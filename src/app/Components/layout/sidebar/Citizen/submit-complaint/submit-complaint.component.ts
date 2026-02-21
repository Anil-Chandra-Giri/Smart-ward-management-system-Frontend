import { Component } from '@angular/core';
import { GeolocationService } from '../../../../../Services/geolocation.service';
import { ApiService } from '../../../../../Services/api.service';

@Component({
  selector: 'app-submit-complaint',
  imports: [],
  templateUrl: './submit-complaint.component.html',
  styleUrl: './submit-complaint.component.css'
})
export class SubmitComplaintComponent {
  
   complaintDetails: string = '';
  latitude: number | null = null;
  longitude: number | null = null;

  constructor(private geolocationService: GeolocationService, private ApiService: ApiService) {}

  submitComplaint() {
  this.geolocationService.getGeolocation().then((coords) => {
    if (coords) {
      this.latitude = coords.latitude;
      this.longitude = coords.longitude;

      this.ApiService.submitComplaint(this.complaintDetails, this.latitude, this.longitude).subscribe({
        next: (res) => { 
          console.log('Complaint submitted successfully:', res);
        },
        error: (error) => { 
          console.error('Error submitting complaint:', error);
        }
      });
    }
  })
}
}

    

      
        