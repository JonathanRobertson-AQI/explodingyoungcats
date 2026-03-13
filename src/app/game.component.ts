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
          restartGame() {
            this.wave = 1;
            this.score = 0;
            this.gameOver = false;
            this.gameWin = false;
            this.spawnKittens();
            this.cdr.detectChanges();
          }
        kittenSpeed = 0.5;
      wave = 1;
      initialKittenCount = 8;
    laserSound: HTMLAudioElement | null = null;
    explosionSound: HTMLAudioElement | null = null;
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
  showStartMessage = false;
  lasers: { x: number, y: number, id: number }[] = [];
  laserId = 0;
  private moveSub?: Subscription;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.laserSound = new Audio('assets/sounds/laser.mp3');
      this.explosionSound = new Audio('assets/sounds/explosion.wav');
    }
    this.showStartMessage = true;
    setTimeout(() => {
      this.showStartMessage = false;
      this.spawnKittens();
      this.cdr.detectChanges();
    }, 1000);
  }

  spawnKittens() {
    let count = this.initialKittenCount;
    if (this.wave === 2) {
      count = this.initialKittenCount * 2;
      this.kittenSpeed = 0.5;
    } else if (this.wave === 3) {
      count = Math.floor(this.initialKittenCount * 2 * 1.5);
      this.kittenSpeed = 0.5 * 1.25;
    }
    this.kittens = Array.from({ length: count }, (_, i) => ({
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
        if (this.wave === 1) {
          this.wave = 2;
          this.spawnKittens();
        } else if (this.wave === 2) {
          this.wave = 3;
          this.spawnKittens();
        } else {
          this.gameWin = true;
        }
        this.moveSub?.unsubscribe();
      }
      this.cdr.detectChanges();
    });
  }

  explodeKitten(kitten: any, event?: MouseEvent) {
    if (!kitten.exploded) {
      kitten.exploded = true;
      this.score += 100;
    }
    // Fire a laser from the bottom at the click position
    let xPercent = kitten.x;
    if (event) {
      xPercent = this.getClickXPercent(event);
    }
    this.fireLaser(xPercent);
  }

  onGameClick(event: MouseEvent) {
    // Only fire if not clicking a kitten
    const target = event.target as HTMLElement;
    if (!target.classList.contains('kitten') && !target.closest('.kitten')) {
      const xPercent = this.getClickXPercent(event);
      this.fireLaser(xPercent);
    }
  }

  getClickXPercent(event: MouseEvent): number {
    const container = (event.currentTarget as HTMLElement);
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    return (x / rect.width) * 100;
  }

  fireLaser(x: number) {
    if (this.laserSound) {
      this.laserSound.currentTime = 0;
      this.laserSound.play();
    }
    const id = this.laserId++;
    let y = 90;
    this.lasers.push({ x, y, id });
    const intervalId = setInterval(() => {
      y -= 5;
      // Check collision with kittens
      this.kittens.forEach((kitten: any) => {
        if (!kitten.exploded && this.laserHitsKitten(x, y, kitten)) {
          kitten.exploded = true;
          this.score += 100;
          if (this.explosionSound) {
            this.explosionSound.currentTime = 0;
            this.explosionSound.play();
          }
        }
      });
      if (y <= 0) {
        this.lasers = this.lasers.filter(l => l.id !== id);
        clearInterval(intervalId);
        this.cdr.detectChanges();
      } else {
        // Update laser position
        const laser = this.lasers.find(l => l.id === id);
        if (laser) {
          laser.y = y;
        }
        this.cdr.detectChanges();
      }
    }, 16);
    this.cdr.detectChanges();
  }

  laserHitsKitten(laserX: number, laserY: number, kitten: any): boolean {
    // Kitten size: 80px, game area: 100vw x 90vh, kitten.x/y are in %
    // We'll use a bounding box collision
    // Laser is 8px wide, 60px tall, but we check the tip (laserY)
    // Assume kittens are 80px x 80px, convert % to px
    const gameWidth = window.innerWidth;
    const gameHeight = window.innerHeight * 0.9;
    const kittenWidth = 80;
    const kittenHeight = 80;
    const kittenXpx = (kitten.x / 100) * gameWidth;
    const kittenYpx = (kitten.y / 100) * gameHeight;
    const laserXpx = (laserX / 100) * gameWidth;
    const laserYpx = (laserY / 100) * gameHeight;
    // Check if laser tip is inside kitten bounding box
    return (
      laserXpx >= kittenXpx &&
      laserXpx <= kittenXpx + kittenWidth &&
      laserYpx >= kittenYpx &&
      laserYpx <= kittenYpx + kittenHeight
    );
  }
}
