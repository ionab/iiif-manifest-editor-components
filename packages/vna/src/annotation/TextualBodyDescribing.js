import * as React from 'react';
import { InsertComment } from '@material-ui/icons';


import { 
  DefaultTooltip as Tooltip,
  ButtonWithTooltip,
  BaseAnnotation,
  IIIFReducer,
  TextPropertiesForm,
  //import IIIFReducer from '../reducers/iiif';
  addResource,
  renderResource,
  SIZING_STRATEGY,
} from '@IIIF-MEC/core';

export default class TextualBodyDescribing extends BaseAnnotation {
  static contentRenderer = annotation => ('');

  static button = ({
    title = 'Text Annotation /w describing',
    ...props
  }) => (
    <ButtonWithTooltip title={title} {...props}>
      <InsertComment />
    </ButtonWithTooltip>
  );

  static icon = ({ color, title = 'Text Annotation /w describing' }) => (
    <Tooltip title={title}>
      <InsertComment color={color} />
    </Tooltip>
  );

  static propertyEditor = TextPropertiesForm;

  static defaultSizing = SIZING_STRATEGY.SCALE_ANNOTATION_TO_CANVAS;

  static defaultBody = {
    type: 'TextualBody',
    value: '',
    format: 'text/plain',
    language: 'en',
  };

  static actions = {
    add: ({ state, dispatch }, options) => {
      if (state.selectedIdsByType.Canvas) {
        const current = TextualBodyDescribing;
        addResource(
          state,
          dispatch,
          renderResource('Annotation', {
            parent: state.selectedIdsByType.Canvas,
            props: {
              motivation: 'describing',
              body: current.defaultBody,
            },
          }),
          current.defaultSizing
        );
        // dispatch(IIIFReducer, {
        //   type: 'ADD_RESOURCE',
        //   options: {
        //     type: 'Annotation',
        //     parent: state.selectedIdsByType.Canvas,
        //     props: {
        //       motivation: 'describing',
        //       body: TextualBodyDescribing.defaultBody,
        //       target: state.selectedIdsByType.Canvas + '#xywh=0,0,200,300',
        //     },
        //   },
        // });
      }
    },
  };
}
