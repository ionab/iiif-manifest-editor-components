import React from 'react';
import ReactDom from 'react-dom';
import PropTypes from 'prop-types';
import {
  withStyles,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@material-ui/core';
import { locale, update as rawUpdate } from '../../utils/IIIFResource';
import { throttle } from 'throttle-debounce';

const styles = theme => ({
  label: {
    backgorund: '#fff',
  },
  metadataRow: {
    display: 'flex',
    flexDirection: 'column',
  },
});

const Behavior = ({ config, classes, target, lang, update }) => {
  if (config) {
    return (config.groups || []).map((group, index) => {
      if (Array.isArray(group)) {
        return (
          <RadioGroup
            aria-label={group.label}
            //className={classes.group}
            value={(target.behavior || [])[index]}
            onChange={ev =>
              update(target, `behavior.${index}`, null, ev.target.value)
            }
            row
          >
            {(group || []).map(value => (
              <FormControlLabel
                key={group.label + ' ' + value}
                value={value}
                control={<Radio color="primary" />}
                label={value}
                labelPlacement="end"
              />
            ))}
          </RadioGroup>
        );
      } else if (typeof group === 'string') {
        return (
          <TextField
            label="Freetext behaivor"
            value={(target.behavior || [])[index]}
            onChange={ev =>
              update(target, `behavior.${index}`, null, ev.target.value)
            }
            className={classes.textField}
            margin="dense"
            multiline
            variant="outlined"
          />
        );
      } else if (
        group.hasOwnProperty('label') &&
        group.hasOwnProperty('values')
      ) {
        return (
          <FormControl component="fieldset">
            <FormLabel component="legend">{group.label}</FormLabel>
            <RadioGroup
              aria-label={group.label}
              className={classes.group}
              value={(target.behavior || [])[index]}
              onChange={ev =>
                update(target, `behavior.${index}`, null, ev.target.value)
              }
              row
            >
              {(group.values || []).map(value => (
                <FormControlLabel
                  key={group.label + ' ' + value}
                  value={value}
                  control={<Radio color="primary" />}
                  label={value}
                  labelPlacement="end"
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      } else if (typeof group === 'function' && !group.name) {
        return group({
          target,
          update,
        });
      } else if (typeof group === 'function' && group.name) {
        console.log('group', group, 'group.name', group.name);
        //ReactDOM.createEleme
        return React.createElement(group.name, {
          target,
          update,
          //classes,
        });
      }
    });
  } else {
    return 'Behaviour Placeholder';
  }
};

class MetadataEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      target: JSON.parse(JSON.stringify(props.target)),
      lastUpdate: new Date().getTime(),
    };
    this.throttledSyncProps = throttle(1000, false, this.syncLocalState);
  }

  static getDerivedStateFromProps(props, state) {
    const currentTime = new Date().getTime();
    if (
      props.target &&
      state.target.id &&
      props.target.id !== state.target.id //||
      //state.lastUpdate + 1000 <= currentTime
    ) {
      console.log('getDerivedStateFromProps', props, state);
      return {
        // Since this method fires on both props and state changes, local updates
        // to the controlled value will be ignored, because the props version
        // always overrides it. Oops!
        target: JSON.parse(JSON.stringify(props.target)),
        lastUpdate: currentTime,
      };
    }
    return null;
  }

  localUpdate = (target, prop, lang, val) => {
    const updated = rawUpdate(target, prop, lang, val);
    this.setState(
      {
        target: updated,
      },
      this.throttledSyncProps
    );
  };

  syncLocalState = () => {
    const currentTime = new Date().getTime();
    this.props.update(this.props.target, null, null, this.state.target);
    this.setState({
      lastUpdate: currentTime,
    });
  };

  render() {
    const { behaviorConfig, classes, target, lang, update } = this.props;
    return (
      <React.Fragment>
        <TextField
          label="Label"
          value={locale(this.state.target.label, lang)}
          onChange={ev =>
            this.localUpdate(this.state.target, 'label', lang, ev.target.value)
          }
          className={classes.textField}
          margin="dense"
          variant="outlined"
        />
        <TextField
          label="Summary"
          value={locale(this.state.target.summary, lang)}
          onChange={ev =>
            this.localUpdate(
              this.state.target,
              'summary',
              lang,
              ev.target.value
            )
          }
          className={classes.textField}
          margin="dense"
          multiline
          variant="outlined"
        />
        <FormControl component="fieldset">
          <FormLabel component="legend">Required Statement</FormLabel>
          <TextField
            label="Label"
            value={locale(
              this.state.target.requiredStatement &&
                this.state.target.requiredStatement.label,
              lang
            )}
            onChange={ev =>
              this.localUpdate(
                this.state.target,
                'requiredStatement.label',
                lang,
                ev.target.value
              )
            }
            className={classes.textField}
            margin="dense"
            variant="outlined"
          />
          <TextField
            label="Value"
            value={locale(
              this.state.target.requiredStatement &&
                this.state.target.requiredStatement.value,
              lang
            )}
            onChange={ev =>
              this.localUpdate(
                this.state.target,
                'requiredStatement.value',
                lang,
                ev.target.value
              )
            }
            className={classes.textField}
            margin="dense"
            multiline
            variant="outlined"
          />
        </FormControl>
        <FormControl component="fieldset">
          <FormLabel component="legend">Metadata</FormLabel>
          {(this.state.target.metadata || [])
            .concat({
              label: {
                [lang]: '',
              },
              value: {
                [lang]: '',
              },
            })
            .map((metadata, index) => (
              <div
                key={`metadata_row__${index}`}
                className={classes.metadataRow}
              >
                <TextField
                  label="Label"
                  value={locale(metadata.label, lang)}
                  onChange={ev =>
                    this.localUpdate(
                      this.state.target,
                      `metadata.${index}.label`,
                      lang,
                      ev.target.value
                    )
                  }
                  className={classes.textField}
                  margin="dense"
                  variant="outlined"
                />
                <TextField
                  label="Value"
                  value={locale(metadata.value, lang)}
                  onChange={ev =>
                    this.localUpdate(
                      this.state.target,
                      `metadata.${index}.value`,
                      lang,
                      ev.target.value
                    )
                  }
                  className={classes.textField}
                  margin="dense"
                  multiline
                  variant="outlined"
                />
              </div>
            ))}
        </FormControl>
        {target.type === 'Manifest' && (
          <TextField
            label="Nav Date"
            type="datetime-local"
            className={classes.textField}
            value={this.state.target.navDate || ''}
            onChange={ev =>
              this.localUpdate(
                this.state.target,
                'navDate',
                null,
                ev.target.value
              )
            }
            margin="dense"
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />
        )}
        <TextField
          label="Rights"
          className={classes.textField}
          value={this.state.target.rights || ''}
          onChange={ev =>
            this.localUpdate(this.state.target, 'rights', null, ev.target.value)
          }
          margin="dense"
          variant="outlined"
        />
        <Behavior
          config={behaviorConfig}
          classes={classes}
          target={target}
          lang={lang}
          update={update}
        />
      </React.Fragment>
    );
  }
}

MetadataEditor.propTypes = {
  target: PropTypes.any,
  /** Language */
  lang: PropTypes.string,
  update: PropTypes.func,
  behaviorConfig: PropTypes.object,
};

MetadataEditor.defaultProps = {
  lang: 'en',
  update: () => () => {},
};

export default withStyles(styles)(MetadataEditor);
