import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitizenSettingsComponent } from './citizen-settings.component';

describe('CitizenSettingsComponent', () => {
  let component: CitizenSettingsComponent;
  let fixture: ComponentFixture<CitizenSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitizenSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitizenSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
