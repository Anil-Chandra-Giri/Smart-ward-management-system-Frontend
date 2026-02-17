import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitizenNoticesComponent } from './citizen-notices.component';

describe('CitizenNoticesComponent', () => {
  let component: CitizenNoticesComponent;
  let fixture: ComponentFixture<CitizenNoticesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitizenNoticesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitizenNoticesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
