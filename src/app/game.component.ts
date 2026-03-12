import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
// ...existing code...
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {
  kittenImages = [
    'assets/png-transparent-cat-kitten-cuteness-cat-brown-tabby-kitten-household-animals-cat-like-mammal-thumbnail.png',
    'assets/png-transparent-kitten-bengal-cat-dog-pet-sitting-puppy-kitten-mammal-cat-like-mammal-animals-thumbnail.png',
    'assets/png-transparent-orange-tabby-kitten-cute-kitten-american-shorthair-cuteness-puppy-kitten-cat-like-mammal-animals-carnivoran-thumbnail.png',
    'assets/png-transparent-silver-tabby-cat-kitten-whiskers-cat-food-cat-person-kitten-mammal-animals-cat-like-mammal-thumbnail.png'
  ];

  kittens: any[] = [];
  score = 0;
  gameOver = false;
  gameWin = false;
  private moveSub?: Subscription;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.spawnKittens();
  }

  spawnKittens() {
    this.kittens = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: 0,
      exploded: false,
      img: this.kittenImages[Math.floor(Math.random() * this.kittenImages.length)]
    }));
    this.animateKittens();
  }

  animateKittens() {
    this.moveSub = interval(100).subscribe(() => {
      this.kittens.forEach((kitten: any) => {
        if (!kitten.exploded && kitten.y < 96) {
          kitten.y += 0.5;
          // Random sideways movement
          const dx = (Math.random() - 0.5) * 4; // -2 to +2
          kitten.x += dx;
          // Clamp x between 0 and 90
          if (kitten.x < 0) kitten.x = 0;
          if (kitten.x > 90) kitten.x = 90;
        }
      });
      // If any kitten is 20% below the screen, game over
      if (this.kittens.some((k: any) => !k.exploded && k.y >= 96)) {
        this.gameOver = true;
        this.moveSub?.unsubscribe();
      }
      // If all kittens are exploded, win
      if (this.kittens.every((k: any) => k.exploded)) {
        this.gameWin = true;
        this.moveSub?.unsubscribe();
      }
      this.cdr.detectChanges();
    });
  }

  explodeKitten(kitten: any) {
    if (!kitten.exploded) {
      kitten.exploded = true;
      this.score += 100;
    }
  }
}
