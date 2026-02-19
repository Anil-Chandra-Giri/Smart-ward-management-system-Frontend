import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SignUp } from '../../Models/sign-up';
import { ApiService } from '../../Services/api.service';

@Component({
  selector: 'app-user-register',
  imports: [FormsModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css'
})
export class UserRegisterComponent {
  constructor(private ApiCall: ApiService){}
  signupData : SignUp = new SignUp();
  confirmPassword:string='';
  
    onSubmit() {
    //   console.log(this.signupData.password);
    //   console.log(this.confirmPassword);
    //     if (this.signupData.password !== this.confirmPassword) {
    //   alert('Passwords do not match.');
    //   return;
    // }
      this.signupData.role="citizen";
      this.ApiCall.createUser(this.signupData).subscribe(
      (response) => {
        console.log('API Response:', response); // Handle successful response
        alert('Form Submitted successfully!');
      },
      (error) => {
        console.error('API Error:', error); // Handle error response
        alert('There was an error submitting the form. Please try again.');
      }
    );
  }

}
