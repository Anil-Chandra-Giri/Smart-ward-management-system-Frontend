import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCellComponent } from './image-cell.component';

describe('ImageCellComponent', () => {
  let component: ImageCellComponent;
  let fixture: ComponentFixture<ImageCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
