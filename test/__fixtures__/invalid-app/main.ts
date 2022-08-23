import * as cdk8s from 'cdk8s';
import * as kplus from 'cdk8s-plus-24';

const app = new cdk8s.App();

const chart = new cdk8s.Chart(app, 'Chart');

new kplus.Deployment(chart, 'Deployment', {

  // just whatever
  containers: [{ image: 'nginx' }],

  // this should cause a violation, which should in turn
  // set the status of the report to 'failure', which should
  // in turn fail the synth command.
  restartPolicy: kplus.RestartPolicy.NEVER,

});

app.synth();