import './styles.css';

import { Game } from './app/Game';

const container = document.querySelector<HTMLElement>('#game');

if (!container) {
  throw new Error('Missing #game container.');
}

const game = new Game(container);
game.start();

