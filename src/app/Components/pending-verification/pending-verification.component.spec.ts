import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingVerificationComponent } from './pending-verification.component';

describe('PendingVerificationComponent', () => {
  let component: PendingVerificationComponent;
  let fixture: ComponentFixture<PendingVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
