const sass = require('@fesk/webpack-config/lib/loaders/sass');
const miniCss = require('@fesk/webpack-config/lib/plugins/mini-css');

module.exports = {
  title: 'IIIF-MEC/core',
  description: 'IIIF Manifest Editor Core Components',
  src: './src/',
  dest: './dist/docs',
  base: '/docs/',
  debug: false,
  port: 5001,
  protocol: 'http',
  modifyBundlerConfig: config => {
    config.module.rules.push(sass);
    config.plugins.push(miniCss);
    return config;
  },
};
