function getVisualizationRootElement(version : [number, number]) : Element {
  // tested with 0.45.1 + 0.46.1 + 0.48.2 + 0.49.1 + 0.49.13
  if (version[0] < 50) {
    return document.querySelector('div.spread.Visualization');
  }
  // tested with 0.50.1 + 0.50.13
  else {
    return document.querySelector('[data-testid="query-visualization-root"]');
  }
}

export default getVisualizationRootElement;
