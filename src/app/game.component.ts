import { Component } from '@angular/core';

@Component({
  selector: 'app-game',
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
    const interval = setInterval(() => {
      this.kittens.forEach(kitten => {
        if (!kitten.exploded && kitten.y < 80) {
          kitten.y += 2;
        }
      });
      if (this.kittens.every(k => k.y >= 80 || k.exploded)) {
        clearInterval(interval);
      }
    }, 100);
  }

  explodeKitten(kitten: any) {
    if (!kitten.exploded) {
      kitten.exploded = true;
      this.score += 100;
    }
  }
}
