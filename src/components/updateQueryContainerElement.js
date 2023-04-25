import applyStyleObjectElement from "./applyStyleObjectElement";
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const containerStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "16px"
}

const updateQueryContainerElement = document.createElement('div');
updateQueryContainerElement.id = getComponentIdFromVariable({updateQueryContainerElement})
applyStyleObjectElement(updateQueryContainerElement, containerStyle);

export default updateQueryContainerElement
