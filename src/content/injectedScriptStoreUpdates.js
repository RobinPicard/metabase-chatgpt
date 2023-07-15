const reduxStore = document.querySelector('#root')?._reactRootContainer?._internalRoot?.current?.memoizedState?.element?.props?.store

if (reduxStore) {

  var latestQueryContent = undefined
  var latestQueryError = undefined
  var latestDatabaseSelected = undefined
  
  // triggered by each update of the store, check whether the fields that interest us have changed
  const onReduxStoreStateUpdate = () => {
    const state = reduxStore.getState()
    const queryContent = state?.qb?.card?.dataset_query?.native?.query
    if (queryContent !== latestQueryContent) {
      sendMessage(queryContent, 'METABASE_CHATGPT_QUERY_CONTENT_STATE');
      latestQueryContent = queryContent;
    }
    const queryError = state?.qb?.queryResults ? state?.qb?.queryResults[0]?.error : undefined
    if (queryError !== latestQueryError) {
      sendMessage(queryError, 'METABASE_CHATGPT_QUERY_ERROR_STATE');
      latestQueryError = queryError;
    }
    const databaseSelected = state?.qb?.card?.dataset_query?.database
    if (databaseSelected !== latestDatabaseSelected) {
      sendMessage(databaseSelected, 'METABASE_CHATGPT_DATABASE_SELECTED_STATE');
      latestDatabaseSelected = databaseSelected;
    }
  }
  
  // Send updates of the store's state via postMessage
  const sendMessage = (content, type) => {
    window.postMessage({
      type: type,
      payload: content
    }, '*');
  };
  
  reduxStore.subscribe(onReduxStoreStateUpdate);

}
