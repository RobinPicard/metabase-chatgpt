import './promptQueryPopupElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const promptQueryPopupElement = document.createElement('textarea');
promptQueryPopupElement.id = getComponentIdFromVariable({promptQueryPopupElement});

export default promptQueryPopupElement;
