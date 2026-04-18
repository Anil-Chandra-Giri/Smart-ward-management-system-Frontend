import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EscalationDashboardComponent } from './escalation-dashboard.component';

describe('EscalationDashboardComponent', () => {
  let component: EscalationDashboardComponent;
  let fixture: ComponentFixture<EscalationDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EscalationDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EscalationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
