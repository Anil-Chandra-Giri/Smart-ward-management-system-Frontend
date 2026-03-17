import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterEventFormComponent } from './disaster-event-form.component';

describe('DisasterEventFormComponent', () => {
  let component: DisasterEventFormComponent;
  let fixture: ComponentFixture<DisasterEventFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterEventFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisasterEventFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
