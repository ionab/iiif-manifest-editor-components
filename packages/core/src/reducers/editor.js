import produce from 'immer';

const EditorReducer = (state, action) => {
  return produce(state, nextState => {
    switch (action.type) {
      case 'UPDATE_CONFIGURATION':
      case 'LOAD_CONFIGURATION':
      case 'CHANGE_LANGUAGE':
        nextState.lang = action.lang;
        break;
      case 'TOGGLE_SELECT_RESOURCE':
        const resourceId =
          action.resource && action.resource.id ? action.resource.id : null;
        const resourceType =
          action.resource && action.resource.type ? action.resource.type : null;
        if (
          resourceId &&
          resourceType &&
          nextState.selectedIdsByType.hasOwnProperty(resourceType)
        ) {
          nextState.selectedIdsByType[resourceType] =
            nextState.selectedIdsByType[resourceType] === resourceId
              ? null
              : resourceId;
          if (
            resourceType === 'Canvas' &&
            nextState.selectedIdsByType.Canvas === null
          ) {
            nextState.selectedIdsByType.Annotation = null;
          }
        }
        break;
      default:
        break;
    }
  });
};

export default EditorReducer;