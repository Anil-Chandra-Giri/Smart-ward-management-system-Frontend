import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterEventListComponent } from './disaster-event-list.component';

describe('DisasterEventListComponent', () => {
  let component: DisasterEventListComponent;
  let fixture: ComponentFixture<DisasterEventListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterEventListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisasterEventListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
