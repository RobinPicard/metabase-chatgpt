import './updateQueryContainerElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const updateQueryContainerElement = document.createElement('div');
updateQueryContainerElement.id = getComponentIdFromVariable({updateQueryContainerElement})

export default updateQueryContainerElement
