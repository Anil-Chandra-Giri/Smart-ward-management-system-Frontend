import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverRouteComponent } from './driver-route.component';

describe('DriverRouteComponent', () => {
  let component: DriverRouteComponent;
  let fixture: ComponentFixture<DriverRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverRouteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
