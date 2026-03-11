import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-image-cell',
  imports: [CommonModule],
  template: `
    <div class = 'image-wrapper'>
     <img 
      *ngIf="imageUrl"
      [src]="fullUrl"
      class="grid-image"
      (click)="openImage()"
    />
</div>
  
  `,

  styles: [`
    .image-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    img {
      width: 90px;        /* 🔥 Increased size */
      height: 90px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    img:hover {
      transform: scale(1.05);
    }

    .grid-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
      cursor: pointer;
    }
  `]
})
export class ImageCellRendererComponent implements ICellRendererAngularComp {
  refresh(): boolean {
    return false;
  }

  public imageUrl: string = '';
  public fullUrl: string = '';

  agInit(params: any): void {
    this.imageUrl = params.value;
    console.log(this.imageUrl);
    this.fullUrl = `https://localhost:7069${this.imageUrl}`;
  }

  openImage() {
    window.open(this.fullUrl, '_blank');
  }

}
