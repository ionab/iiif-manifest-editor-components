import React from 'react';
import * as classnames from 'classnames';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import {
  LibraryAdd,
  LibraryBooks,
  SaveAlt,
  Visibility,
  Input,
} from '@material-ui/icons';

import {
  // components
  AnnotationList,
  CanvasList,
  IIIFCollectionExplorer,
  EditableCanvasPanel,
  Properties,
  TabPanel,
  ManifestEditor,
  SourcePreviewDialog,
  DefaultLoadManifestDialog,
  ManifestEditorAppBar as AppBar,
  ApplicationLayout as Layout,
  AppBarButton,
  // annotation 
  TextLayoutViewFocus,
  ImagePainting,
  // utils
  renderResource,
  queryResourceById,
  locale,
  update,
  download,
  convertToV3ifNecessary,
  // Reducers
  IIIFReducer,
  EditorReducer,
} from '@IIIF-MEC/core';

import EditorModeSelector from '../components/EditorModeSelector';
import LoadManifestModal from '../components/LoadManifestModal';
import SaveManifestModal from '../components/SaveManifestModal';
import PreviewModal from '../components/PreviewModal';
import SlideEditor from '../components/SlideEditor';
import TextualBodyDescribing from '../annotation/TextualBodyDescribing';
import  { saveFixtures } from '../utils';
import './VAMEditor.scss';

const isLocalhost = () => 
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "0.0.0.0"   
// Temporary override until the settings panel hasn't been funded.
window.rootManifestUrl = isLocalhost()
  ? 'http://localhost:8181/p3/'
  : 'https://nhbv322uy3.execute-api.eu-west-1.amazonaws.com/staging/p3/';
  //: ///'http://iiif-collection.ch.digtest.co.uk/p3/';
const emptyFn = () => {};

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#000',
      contrastText: '#ff9a00',
    },
    secondary: {
      main: '#ff9a00',
      contrastText: '#000',
    },
  },
  typography: {
    fontSize: 12,
    useNextVariants: true,
  },
  mixins: {
    toolbar: {
      minHeight: 36,
    },
  },
});


const SLIDESHOW_BEHAVIOURS = {
  Canvas: {
    groups: [
      {
        label: 'layout', 
        values: ['layout-overlay', 'layout-split'],
      },
      {
        label: 'info position',
        values: [
          'info-position-left',
          'info-position-right',
          'info-position-center',
        ],
      },
      //'*',
    ],
  },
};

const SLIDESHOW_PROPERTIES_LABEL = {
  'Properties.Annotation': 'Item',
  'Properties.Canvas': 'Slide',
  'Properties.Manifest': 'Slideshow',
  'Canvas.Summary': 'Short description',
  'Canvas.Label': 'Title',
  'Canvas.RequiredStatement': 'Legal notice',
  'Canvas.RequiredStatement.Label': 'Title',
  'Canvas.RequiredStatement.Value': 'Body',
  'Canvas.Metadata': 'Additional info',
  'Canvas.Metadata.Label': 'Title',
  'Canvas.Behaviors': 'Positioning',
  'NewAnnotationForm.fitCanvasToContent': 'add',
  'NewAnnotationForm.fitContentToCanvas': 'add',
  'Canvas.behavior.label.layout': 'Slide layout',
  'Canvas.behavior.value.layout-overlay': 'text overlay',
  'Canvas.behavior.value.layout-split': 'split',
  'Canvas.behavior.value.info-position-left': 'left',
  'Canvas.behavior.value.info-position-center': 'center',
  'Canvas.behavior.value.info-position-right': 'right',
};

const ANNOTATED_ZOOM_PROPERTIES_LABEL = {
  'NewAnnotationForm.fitCanvasToContent': 'add',
  'NewAnnotationForm.fitContentToCanvas': 'add',
};

const UI_LABELS = {
  'slideshow': SLIDESHOW_PROPERTIES_LABEL,
  'annotated-zoom': ANNOTATED_ZOOM_PROPERTIES_LABEL,
};

class VAMEditor extends React.Component {
  

  constructor(props) {
    super(props);
    const initialNewManifest = this.newManifest();
    this.state = {
      rootResource: initialNewManifest,
      selectedIdsByType: {
        Canvas: initialNewManifest.items[0].id,
        Annotation: null,
      },
      lang: 'en',
      editorMode: 'slideshow',
      loadManifestDialogOpen: false,
      saveManifestDialogOpen: false,
      previewModalOpen: false,
    };
  }

  changeLanguage = lang => {
    this.dispatch(EditorReducer, { type: 'CHANGE_LANGUAGE', lang });
  };

  dispatch = (reducer, action, afterStateChange) => {
    this.setState(reducer(this.state, action), afterStateChange);
  };

  selectResource = resource => {
    this.dispatch(EditorReducer, {
      type: 'TOGGLE_SELECT_RESOURCE',
      resource,
    });
  };

  deleteResource = resource => {
    this.dispatch(IIIFReducer, {
      type: 'REMOVE_RESOURCE',
      id: resource.id,
    });
  };

  invokeAction2 = (fn, options) => () => {
    if (!fn) {
      return;
    }

    fn(
      {
        state: this.state,
        dispatch: this.dispatch,
      },
      options
    );
  };
  //TODO: deprecated replaced by the above
  invokeAction = (action, options) => {
    switch (action) {
      case 'add-canvas':
        this.dispatch(IIIFReducer, {
          type: 'ADD_RESOURCE',
          options: {
            type: 'Canvas',
            parent: this.state.rootResource,
          },
        });
        break;
      default:
        break;
    }
  };

  updateProperty = (target, property, lang, value, afterStateChange) => {
    this.dispatch(IIIFReducer, {
      type: 'UPDATE_RESOURCE',
      options: {
        id: target.id,
        props: update(target, property, lang, value),
      },
    }, afterStateChange);
  };

  updateResource = (target, props) => {
    this.dispatch(IIIFReducer, {
      type: 'UPDATE_RESOURCE',
      options: {
        id: target.id,
        props,
      },
    });
  };

  regenerateIds = (manifestId, afterStateChange) => {
    this.dispatch(IIIFReducer, {
      type: 'REGENERATE_IDS',
      manifestId, 
    }, afterStateChange);
  };

  saveProject = () => {
    download(
      saveFixtures(this.state.rootResource),
      locale(this.state.rootResource.label, this.state.lang) + '.json'
    );
  };

  newManifest = () => {
    const newManifest = renderResource('Manifest');
    const newCanvas = renderResource('Canvas', { parent: newManifest });
    newManifest.items.push(newCanvas);
    return newManifest;
  };

  newProject = () => {
    this.dispatch(IIIFReducer, {
      type: 'LOAD_MANIFEST',
      manifest: this.newManifest(),
    });
  };

  togglePreviewDialog = () => {
    this.setState({
      previewDialogOpen: !this.state.previewDialogOpen,
    });
  };

  setEditorMode = (ev, selectedElement) => {
    this.setState({
      editorMode: selectedElement.props.value,
    }, () => {
      const behaviours = (this.state.rootResource.behavior || []).filter(item=>item!=='vam-slideshow' && item !=='vam-annotated-zoom'); 
      if (selectedElement.props.value !== 'default') {
        behaviours.push('vam-' + selectedElement.props.value);
      }
      this.updateProperty(
        this.state.rootResource, 
        'behavior', 
        null, 
        behaviours
      )
    });

  };

  toggleLoadManifestDialog = () => {
    this.setState({
      loadManifestDialogOpen: !this.state.loadManifestDialogOpen,
    });
  };

  toggleLoadManifestDialog2 = () => {
    this.setState({
      loadManifestDialogOpen2: !this.state.loadManifestDialogOpen2,
    });
  };

  toggleSaveManifestDialog = () => {
    this.setState({
      saveManifestDialogOpen: !this.state.saveManifestDialogOpen,
    });
  };

  toggleItemPreview = () => {
    this.setState({
      previewModalOpen: !this.state.previewModalOpen,
    });
  };


  loadManifest = json => {
    this.dispatch(IIIFReducer, {
      type: 'LOAD_MANIFEST',
      manifest: convertToV3ifNecessary(json),
    });
    if (this.state.loadManifestDialogOpen) {
      this.toggleLoadManifestDialog();
    }
    if(this.state.loadManifestDialogOpen2) {
      this.toggleLoadManifestDialog2();
    }
  };

  render() {
    const canvases = this.state.rootResource
      ? this.state.rootResource.items
      : [];
    const selectedCanvas = queryResourceById(
      this.state.selectedIdsByType.Canvas,
      this.state.rootResource
    );
    const annotations =
      selectedCanvas && selectedCanvas.items && selectedCanvas.items.length > 0
        ? selectedCanvas.items[0].items || null
        : null;
    const selectedAnnotation = queryResourceById(
      this.state.selectedIdsByType.Annotation,
      selectedCanvas
    );
    const { lang, editorMode } = this.state;
    const annotationConfig = {
      'Image::painting': ImagePainting,
    };
    const annotationFormButtons = {
      NewAnnotationForm: ['dismiss', 'fitCanvasToContent'],
    };
    if (editorMode !== 'slideshow') {
      annotationConfig['TextualBody::describing'] =  TextualBodyDescribing;
      annotationFormButtons['TextualBodyDescribing.NewAnnotationForm'] = ['dismiss', 'fitContentToCanvas'];
    }
    if (editorMode !== 'annotated-zoom') {
      annotationConfig['TextualBody::layout-viewport-focus'] = TextLayoutViewFocus;
      annotationFormButtons['TextLayoutViewFocus.NewAnnotationForm'] = ['dismiss', 'fitContentToCanvas'];
    }
    return (
      <MuiThemeProvider theme={theme}>
        <ManifestEditor
          invokeAction={this.invokeAction2}
          config={{
            appBarButtonStyle: 'icon-and-label',
            hideHeaderForSingleTab: true,
          }}
          annotation={annotationConfig}
          metaOntology={UI_LABELS[editorMode] || {}}
          behavior={editorMode === 'slideshow' ? SLIDESHOW_BEHAVIOURS:  {}}
          annotationFormButtons={annotationFormButtons}
          propertyFields={editorMode === 'slideshow' ? {
            Manifest: [
              'label',
              'summary',
              'requiredStatement',
              'metadata',
              'navDate',
              'rights',
            ],
            Canvas: [
              'behavior',
              'label',
              'summary',
              'requiredStatement',
            ],
            Annotation: [
              'label',
              'summary',
            ],
            AudioPropertiesFrom: ['body.id'],
            VideoPropertiesFrom: [
              'body.id',
              'thumbnail.0.service.id',
              'thumbnail.0.id',
            ],
            TextPropertiesForm: ['body.id', 'body.value'],
            ImagePropertiesForm: [
              'body.service.id',
              'body.id',
              'thumbnail.0.service.id',
              'thumbnail.0.id',
            ],
          } : null}
          iiifResourceDefaults={{
            Canvas: {
              behavior: ['layout-split', 'info-position-left'],
            },
          }}
        >
          <Layout>
            <AppBar titleComponent={
              <EditorModeSelector selected={editorMode} onSelect={this.setEditorMode} />
            }>
              <AppBarButton
                text="New Manifest"
                onClick={this.newProject}
                icon={<LibraryAdd />}
              />
              <AppBarButton
                text="Load Manifest"
                onClick={this.toggleLoadManifestDialog}
                icon={<LibraryBooks />}
              />
              <AppBarButton
                text="Save Manifest"
                onClick={this.toggleSaveManifestDialog}
                icon={<LibraryBooks />}
              />
              <AppBarButton
                text="Download Manifest"
                onClick={this.saveProject}
                icon={<SaveAlt />}
              />
              <AppBarButton
                text="Preview JSON"
                onClick={this.togglePreviewDialog}
                icon={<Visibility />}
              />
              <AppBarButton
                text="Preview"
                onClick={this.toggleItemPreview}
                icon={<Visibility />}
              />
              {/* <AppBarButton
                text="Load Manifest"
                onClick={this.toggleLoadManifestDialog2}
                icon={<Input />}
              /> */}
            </AppBar>
            <Layout.Middle>
              <Layout.Left>
                <AnnotationList
                  annotations={annotations}
                  lang={lang}
                  selected={this.state.selectedIdsByType.Annotation}
                  select={this.selectResource}
                  remove={this.deleteResource}
                  invokeAction={this.invokeAction2}
                  selectedColor="secondary"
                  isEditingAllowed={!!this.state.selectedIdsByType.Canvas}
                />
              </Layout.Left>
              <Layout.Center>
                {editorMode === 'slideshow' && (!selectedAnnotation||(selectedAnnotation && selectedAnnotation.motivation !== 'layout-viewport-focus')) ? (
                  <SlideEditor 
                    manifestJSON={this.state.rootResource} 
                    canvasId={this.state.selectedIdsByType.Canvas}
                  />
                ) : (
                  <EditableCanvasPanel
                    canvas={selectedCanvas}
                    selectedAnnotation={this.state.selectedIdsByType.Annotation}
                    select={this.selectResource}
                    update={this.updateResource}
                    annotationColor="secondary"
                  />
                )}
              </Layout.Center>
              <Layout.Right>
                <TabPanel>
                  <Properties
                    title="Properties"
                    manifest={this.state.rootResource}
                    canvas={selectedCanvas}
                    annotation={selectedAnnotation}
                    lang={lang}
                    changeLanguage={this.changeLanguage}
                    update={this.updateProperty}
                    noTranslation={true}
                  />
                  <IIIFCollectionExplorer
                    title="IIIF Collection Explorer"
                    url={window.rootManifestUrl}
                  />
                </TabPanel>
              </Layout.Right>
            </Layout.Middle>
            {editorMode !== 'annotated-zoom' && (
              <Layout.Bottom>
                <CanvasList
                  canvases={canvases}
                  lang={lang}
                  selected={this.state.selectedIdsByType.Canvas}
                  select={this.selectResource}
                  remove={this.deleteResource}
                  invokeAction={this.invokeAction}
                />
              </Layout.Bottom>
            )}
          </Layout>
        </ManifestEditor>
        <SourcePreviewDialog
          json={saveFixtures(this.state.rootResource)}
          open={this.state.previewDialogOpen}
          handleClose={this.togglePreviewDialog}
        />
        <LoadManifestModal
          open={this.state.loadManifestDialogOpen}
          handleClose={this.toggleLoadManifestDialog}
          collectionURL={window.rootManifestUrl}
          loadManifest={this.loadManifest}
        />
        <PreviewModal
          open={this.state.previewModalOpen}
          handleClose={this.toggleItemPreview}
          manifest={this.state.rootResource}
        />
        {this.state.saveManifestDialogOpen && (
          <SaveManifestModal
            manifest={this.state.rootResource}
            open={this.state.saveManifestDialogOpen}
            handleClose={this.toggleSaveManifestDialog}
            regenerateIds={this.regenerateIds}
          />
        )}
        <DefaultLoadManifestDialog
          open={this.state.loadManifestDialogOpen2}
          loadManifest={this.loadManifest}
          handleClose={this.toggleLoadManifestDialog2}
        />
      </MuiThemeProvider>
    );
  }
}

export default VAMEditor;