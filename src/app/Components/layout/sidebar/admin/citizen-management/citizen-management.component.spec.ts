import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitizenManagementComponent } from './citizen-management.component';

describe('CitizenManagementComponent', () => {
  let component: CitizenManagementComponent;
  let fixture: ComponentFixture<CitizenManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitizenManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitizenManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
