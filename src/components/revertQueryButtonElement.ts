import './revertQueryButtonElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const revertQueryButtonElement = document.createElement('div');
revertQueryButtonElement.id = getComponentIdFromVariable({revertQueryButtonElement})
revertQueryButtonElement.innerHTML = 'Revert'

export default revertQueryButtonElement
