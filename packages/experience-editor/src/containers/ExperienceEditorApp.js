import * as React from 'react';
import * as PropTypes from 'prop-types';

import { LibraryAdd, LibraryBooks, SaveAlt, Visibility } from '@material-ui/icons';
import { AppBarButton, ManifestEditorApp } from '@iiif-mec/core';

import EditorModeSelector from '../components/EditorModeSelector';
import LoadManifestModal from '../components/LoadManifestModal';
import SaveManifestModal from '../components/SaveManifestModal';
import PreviewModal from '../components/Preview/PreviewModal';
import SlideEditor from '../components/SlideEditor';
import configs from '../defaults';

class ExperienceEditorApp extends ManifestEditorApp {

  componentDidMount() {
    window.addEventListener('beforeunload', this.onUnload);
  }
  
  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onUnload);
  }

  buildAppBarProps = () => ({
    titleComponent: (
      <EditorModeSelector
        selected={this.state.editorMode}
        onSelect={this.setEditorMode}
      />
    )
  });

  setUpDialogComponents = () => {
    this.dialogs = [{
      renderer: this.renderSourcePreviewDialog,
      openState: 'previewDialogOpen'
    }, {
      renderer: this.renderDefaultLoadManifestDialog,
      openState: 'loadManifestDialogOpen'
    }];
  };

  getConfig = () => ({
    config: {
      appBarButtonStyle: 'icon-and-label',
      hideHeaderForSingleTab: true,
    },
    ...configs[this.state.editorMode || 'default']
  });

  newProject = () => {
    if ((window.lastPersist || 0) < window.lastOperation) {
      if (
        !window.confirm(
          `Your project hasn't been saved, would you like to continue`
        )
      ) {
        return;
      }
    }
    this.dispatch(IIIFReducer, {
      type: 'LOAD_MANIFEST',
      manifest: this.newManifest(),
    });
  };
  
  onUnload = ev => {
    // the method that will be used for both add and remove event
    const result = (window.lastPersist || 0) < window.lastOperation;
    if (result) {
      ev.returnValue = result;
      return result;
    } else {
      ev.preventDefault();
    }
  };

  renderAppBarButtons = () => (
    <React.Fragment>
      <AppBarButton
        text="New"
        onClick={this.newProject}
        icon={<LibraryAdd />}
      />
      <AppBarButton
        text="Load"
        onClick={this.toggleLoadManifestDialog}
        icon={<LibraryBooks />}
      />
      <AppBarButton
        text="Save"
        onClick={this.toggleSaveManifestDialog}
        icon={<LibraryBooks />}
      />
      <AppBarButton
        text="Download"
        onClick={this.saveProject}
        icon={<SaveAlt />}
      />
      {this.state.editorMode === 'default' && (
        <AppBarButton
          text="Preview JSON"
          onClick={this.togglePreviewDialog}
          icon={<Visibility />}
        />
      )}
      <AppBarButton
        text="Preview"
        onClick={this.toggleItemPreview}
        icon={<Visibility />}
      />
    </React.Fragment>
  );

  setEditorMode = (ev, selectedElement) => {
    this.setState(
      {
        editorMode: selectedElement.props.value,
      },
      () => {
        const manifest = this.state.resources[this.state.rootResource];
        const behaviours = (manifest.behavior || []).filter(
          item => item !== 'slideshow' && item !== 'annotated-zoom'
        );
        if (selectedElement.props.value !== 'default') {
          behaviours.push(selectedElement.props.value);
        }
        this.updateProperty(
          manifest,
          'behavior',
          null,
          behaviours
        );
      }
    );
  };

  renderCentrePanelComponents = (panelProps) => 
    this.state.editorMode === 'slideshow' &&
      (!panelProps.selectedAnnotation || 
        (panelProps.selectedAnnotation && panelProps.selectedAnnotation.motivation !== 'layout-viewport-focus')) 
      ? (
        <SlideEditor
          manifestJSON={this.state.rootResource}
          canvasId={this.state.selectedIdsByType.Canvas}
        />
      ) 
      : this.renderCanvasEditor(panelProps);

  renderBottomPanelComponents = (panelProps) => 
    this.state.editorMode !== 'annotated-zoom' && 
    this.renderCanvasList(panelProps);
  
};

export default ExperienceEditorApp;