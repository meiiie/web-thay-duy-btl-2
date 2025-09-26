import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.html',
  styleUrls: ['./loading.scss'],
  imports: [CommonModule],
  standalone: true
})
export class LoadingComponent {
  @Input() title: string = 'Đang tải...';
  @Input() message: string = 'Vui lòng chờ trong giây lát';
  @Input() fullscreen: boolean = false;
  @Input() showProgress: boolean = false;
  @Input() progress: number = 0;
}