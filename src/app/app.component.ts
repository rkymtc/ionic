import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Platform } from '@ionic/angular';
import { FirebaseService } from './core/services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private firebaseService: FirebaseService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      SplashScreen.hide().catch(err => {
        console.warn('Error hiding splash screen:', err);
      });
    });
  }
}
