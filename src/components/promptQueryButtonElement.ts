import './promptQueryButtonElement.css';

import magicWandIcon from '../../assets/magicWandIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const promptQueryButtonElement = document.createElement('div');
promptQueryButtonElement.id = getComponentIdFromVariable({promptQueryButtonElement});

const imageElement = document.createElement('img');
imageElement.src = chrome.runtime.getURL(magicWandIcon);
imageElement.className = 'img';

const textElement = document.createElement('span');
textElement.innerHTML = 'Prompt';
textElement.className = 'text';

promptQueryButtonElement.appendChild(imageElement);
promptQueryButtonElement.appendChild(textElement);

export default promptQueryButtonElement;
