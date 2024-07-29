function getEditorTopBar(version : [number, number]) : Element {
  return document.querySelector('[data-testid="native-query-top-bar"]').children[2];
}

export default getEditorTopBar;
  