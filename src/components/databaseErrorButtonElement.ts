import './databaseErrorButtonElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const databaseErrorButtonElement = document.createElement('div');
databaseErrorButtonElement.id = getComponentIdFromVariable({databaseErrorButtonElement})
databaseErrorButtonElement.innerHTML = 'Explain'

export default databaseErrorButtonElement
