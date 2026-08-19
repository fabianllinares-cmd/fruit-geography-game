import { registerSW } from 'virtual:pwa-register';
import './style.css';
import { App } from './ui/app';

registerSW({ immediate: true });

const app = new App();
app.start();

declare global {
  interface Window {
    __game: App['debug'];
  }
}

window.__game = app.debug;
