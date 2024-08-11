import * as cdk8s from 'cdk8s';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as kplus from 'cdk8s-plus-28';

const app = new cdk8s.App();

const chart = new cdk8s.Chart(app, 'Chart');

new kplus.Deployment(chart, 'Deployment1', {

  // just whatever
  containers: [{ image: 'nginx' }],

  // this should cause a violation, which should in turn
  // set the status of the report to 'failure', which should
  // in turn fail the synth command.
  restartPolicy: kplus.RestartPolicy.NEVER,

});

new kplus.Deployment(chart, 'Deployment2', {

  // just whatever
  containers: [{ image: 'nginx' }],

  // this should cause a violation, which should in turn
  // set the status of the report to 'failure', which should
  // in turn fail the synth command.
  restartPolicy: kplus.RestartPolicy.NEVER,

});

app.synth();