import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Button, Typography, withStyles } from '@material-ui/core';

const style = theme => ({
  text: {
    marginLeft: theme.spacing.unit,
  },
});

const TextAppBarButton = ({ text, onClick, icon }) => (
  <Button color="secondary" onClick={onClick}>
    {icon}
    <Typography color="secondary" className={classes.text}>
      {text}
    </Typography>
  </Button>
);

TextAppBarButton.propTypes = {
  /* icon component used for the app bar button */
  icon: PropTypes.elementType,
  /* click event handler */
  onClick: PropTypes.func,
  /* button text */
  text: PropTypes.string,
};

export default withStyles(style)(TextAppBarButton);
