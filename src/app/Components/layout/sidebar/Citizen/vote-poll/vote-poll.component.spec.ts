import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VotePollComponent } from './vote-poll.component';

describe('VotePollComponent', () => {
  let component: VotePollComponent;
  let fixture: ComponentFixture<VotePollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotePollComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VotePollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
