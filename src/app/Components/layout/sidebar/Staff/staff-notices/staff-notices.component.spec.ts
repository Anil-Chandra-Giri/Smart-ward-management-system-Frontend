import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffNoticesComponent } from './staff-notices.component';

describe('StaffNoticesComponent', () => {
  let component: StaffNoticesComponent;
  let fixture: ComponentFixture<StaffNoticesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffNoticesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffNoticesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
