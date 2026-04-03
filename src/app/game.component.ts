import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HighScoreApiService,
  HighScoreResponse,
} from './high-score-api.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {
  meowSound: HTMLAudioElement | null = null;
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
  showTitleScreen = false;
  showStartMessage = false;
  lasers: { x: number, y: number, id: number }[] = [];
  laserId = 0;
  playerName = 'Player 1';
  submittingScore = false;
  scoreSubmitSuccess = false;
  scoreSubmitError: string | null = null;
  loadingLeaderboard = false;
  leaderboardError: string | null = null;
  topScores: HighScoreResponse[] = [];
  private hasSubmittedScore = false;
  private moveSub?: Subscription;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private highScoreApi: HighScoreApiService
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.laserSound = new Audio('assets/sounds/laser.mp3');
      this.explosionSound = new Audio('assets/sounds/explosion.wav');
      this.meowSound = new Audio('assets/sounds/meow.mp3');
      this.playerName = window.localStorage.getItem('catInvaders.playerName') ?? 'Player 1';
    }

    this.loadTopScores();

    this.showTitleScreen = true;
    setTimeout(() => {
      this.showTitleScreen = false;
      this.showStartMessage = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.showStartMessage = false;
        this.spawnKittens();
        this.cdr.detectChanges();
      }, 1000);
    }, 1000);
  }

  spawnKittens() {
        if (this.meowSound) {
          this.meowSound.currentTime = 0;
          this.meowSound.play();
        }
    let count = this.initialKittenCount;
    // Set count for each wave as before
    if (this.wave === 2) {
      count = this.initialKittenCount * 2;
    } else if (this.wave === 3) {
      count = Math.floor(this.initialKittenCount * 2 * 1.5);
    } else if (this.wave === 4) {
      count = Math.floor(this.initialKittenCount * 2 * 1.5 * 2);
    } else if (this.wave === 5) {
      count = Math.floor(this.initialKittenCount * 2 * 1.5 * 2 * 2);
    }
    // Make each wave 50% faster than the previous
    this.kittenSpeed = 0.5 * Math.pow(1.5, this.wave - 1);
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
    this.moveSub?.unsubscribe();
    this.moveSub = interval(100).subscribe(() => {
      if (this.gameOver || this.gameWin) {
        return;
      }

      this.kittens.forEach((kitten: any) => {
        if (!kitten.exploded && kitten.y < 96) {
          kitten.y += this.kittenSpeed;
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
        this.loadTopScores();
        this.cdr.detectChanges();
        return;
      }

      // If all kittens are exploded, win or next wave
      if (this.kittens.every((k: any) => k.exploded)) {
        this.moveSub?.unsubscribe();
        if (this.wave === 1) {
          this.wave = 2;
          this.spawnKittens();
        } else if (this.wave === 2) {
          this.wave = 3;
          this.spawnKittens();
        } else if (this.wave === 3) {
          this.wave = 4;
          this.spawnKittens();
        } else if (this.wave === 4) {
          this.wave = 5;
          this.spawnKittens();
        } else {
          this.gameWin = true;
          this.loadTopScores();
        }
        this.cdr.detectChanges();
        return;
      }

      this.cdr.detectChanges();
    });
  }

  restartGame() {
    this.moveSub?.unsubscribe();
    this.wave = 1;
    this.score = 0;
    this.gameOver = false;
    this.gameWin = false;
    this.kittens = [];
    this.lasers = [];
    this.hasSubmittedScore = false;
    this.submittingScore = false;
    this.scoreSubmitSuccess = false;
    this.scoreSubmitError = null;
    this.spawnKittens();
    this.cdr.detectChanges();
  }

  explodeKitten(kitten: any, event?: MouseEvent) {
    if (this.gameOver || this.gameWin) {
      return;
    }

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
    if (this.gameOver || this.gameWin) {
      return;
    }

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

  saveHighScore(): void {
    if (this.hasSubmittedScore || this.score <= 0) {
      return;
    }

    const normalizedName = this.playerName.trim() || 'Anonymous';
    this.playerName = normalizedName;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('catInvaders.playerName', normalizedName);
    }

    this.submittingScore = true;
    this.scoreSubmitSuccess = false;
    this.scoreSubmitError = null;

    this.highScoreApi
      .submitHighScore({
        playerName: normalizedName,
        score: this.score,
        levelReached: this.wave,
      })
      .subscribe({
        next: () => {
          this.hasSubmittedScore = true;
          this.submittingScore = false;
          this.scoreSubmitSuccess = true;
          this.loadTopScores();
          this.cdr.detectChanges();
        },
        error: () => {
          this.submittingScore = false;
          this.scoreSubmitError = 'Could not save your high score right now.';
          this.cdr.detectChanges();
        },
      });
  }

  private loadTopScores(): void {
    this.loadingLeaderboard = true;
    this.leaderboardError = null;

    this.highScoreApi.getTopHighScores(10).subscribe({
      next: (scores) => {
        this.topScores = scores;
        this.loadingLeaderboard = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingLeaderboard = false;
        this.leaderboardError = 'Could not load leaderboard.';
        this.cdr.detectChanges();
      },
    });
  }
}
