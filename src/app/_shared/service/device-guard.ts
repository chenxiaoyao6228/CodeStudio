import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DeviceService } from './device.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class PcOnlyGuard implements CanActivate {

    private deviceService = inject(DeviceService)
    private snackBar =  inject(MatSnackBar)
  constructor(
  ) {}

  canActivate(): boolean {
    if (this.deviceService.isPC()) {
      return true;
    } else {
      this.snackBar.open('This application can only be accessed on a PC.', 'Close', {
        duration: 5000,
      });
      return false;
    }
  }
}
