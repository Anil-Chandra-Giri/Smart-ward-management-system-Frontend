import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyCitizenComponent } from './verify-citizen.component';

describe('VerifyCitizenComponent', () => {
  let component: VerifyCitizenComponent;
  let fixture: ComponentFixture<VerifyCitizenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyCitizenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyCitizenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
