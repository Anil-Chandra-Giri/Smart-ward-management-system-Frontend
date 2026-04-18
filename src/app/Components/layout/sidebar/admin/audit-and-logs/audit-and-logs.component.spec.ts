import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditAndLogsComponent } from './audit-and-logs.component';

describe('AuditAndLogsComponent', () => {
  let component: AuditAndLogsComponent;
  let fixture: ComponentFixture<AuditAndLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditAndLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditAndLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
