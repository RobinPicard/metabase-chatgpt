const reduxStore = document.querySelector('#root')._reactRootContainer._internalRoot.current.memoizedState.element.props.store
var latestQueryContent = undefined

// triggered by each update of the store, check whether the fields that interest us have changed
const onReduxStoreStateUpdate = () => {
  const state = reduxStore.getState()
  const queryContent = state?.qb?.card?.dataset_query?.native?.query
  if (queryContent !== latestQueryContent) {
    sendMessageQueryContent(queryContent);
    latestQueryContent = queryContent;
  }
}

// Send updates of the store's state via postMessage
const sendMessageQueryContent = (queryContent) => {
  window.postMessage({
    type: 'METABASE_CHATGPT_QUERY_CONTENT_STATE',
    payload: queryContent
  }, '*');
};

reduxStore.subscribe(onReduxStoreStateUpdate);
