import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtimeUpdatesComponent } from './realtime-updates.component';

describe('RealtimeUpdatesComponent', () => {
  let component: RealtimeUpdatesComponent;
  let fixture: ComponentFixture<RealtimeUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealtimeUpdatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealtimeUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
