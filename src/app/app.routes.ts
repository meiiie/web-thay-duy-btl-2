import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { QrScannerComponent } from './components/qr-scanner/qr-scanner';
import { VotingComponent } from './components/voting/voting';
import { AdminComponent } from './components/admin/admin';
import { AdminLoginComponent } from './components/admin/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'scan', component: QrScannerComponent },
  { path: 'voting', component: VotingComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/' }
];