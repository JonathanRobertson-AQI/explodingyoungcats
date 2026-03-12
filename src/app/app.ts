import { Component, signal } from '@angular/core';
import { GameComponent } from './game.component';

@Component({
  selector: 'app-root',
  imports: [GameComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('explodingyoungcats');
}
