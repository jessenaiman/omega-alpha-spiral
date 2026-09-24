import './tokens.css';
import './styles.css';
import { BootScene } from './BootScene';
import { showStartMenu } from './StartMenu';

showStartMenu(() => new BootScene().init());
