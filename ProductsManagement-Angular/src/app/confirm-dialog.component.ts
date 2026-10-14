import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm">
      <div class="confirm-icon"><i class="fa-solid fa-circle-question"></i></div>
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="confirm-actions">
        <button type="button" class="btn btn-secondary" [mat-dialog-close]="false">Não</button>
        <button type="button" class="btn btn-primary" [mat-dialog-close]="true">Sim</button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}
}
