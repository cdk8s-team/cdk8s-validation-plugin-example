import * as cdk8s from 'cdk8s';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as kplus from 'cdk8s-plus-28';

const app = new cdk8s.App();

const chart = new cdk8s.Chart(app, 'Chart');

new kplus.Deployment(chart, 'Deployment', {

  // just whatever
  containers: [{ image: 'nginx' }],

  // this is the value our plugin expects
  // so this app should pass validation.
  restartPolicy: kplus.RestartPolicy.ALWAYS,

});

app.synth();