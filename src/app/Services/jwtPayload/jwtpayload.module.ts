// In your auth.service.ts or wherever JwtPayload is defined
export class JwtPayload {
  UserId: string = '';
  UserName: string = '';
  exp: number = 0;
  Role: string = '';
  WardNumber: string = ''; 
  Email: string = '';       
  IsFirstLogin: string = ''; 
  IsVerified: string = '';   
  iss: string = '';         
  aud: string = '';        
}