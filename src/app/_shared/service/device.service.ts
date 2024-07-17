import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  constructor() {}

  isPC(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipod|ipad|android|blackberry|windows phone|opera mini|iemobile/i.test(userAgent);
    return !isMobile;
  }
}
