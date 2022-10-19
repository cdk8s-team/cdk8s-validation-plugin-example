import * as path from 'path';
import * as cdk8s from 'cdk8s';
import { ValidationContext } from 'cdk8s-cli/plugins';
import * as kplus from 'cdk8s-plus-24';
import * as fs from 'fs-extra';
import * as yaml from 'yaml';
import { ExampleValidation } from '../src';
import { withTempDir } from './utils';

test('specific kinds can be ignored', async () => {

  await withTempDir(async (dir: string) => {

    // create a manifest that causes a violation
    const chart = cdk8s.Testing.chart();
    new kplus.Deployment(chart, 'Deployment', {
      containers: [{ image: 'nginx' }],
      restartPolicy: kplus.RestartPolicy.NEVER,
    });
    const manifest = chart.toJson();
    const manifestPath = path.join(dir, 'manifest.yaml');
    fs.writeFileSync(manifestPath, yaml.stringify(manifest));

    // when used with cdk8s, cdk8s will instantiate both the plugin and
    // the context for it. in our unit tests, we need to do it.
    const validation = new ExampleValidation({ ignoreKinds: ['Deployment'] });
    const context = new ValidationContext([manifestPath], 'cdk8s-validation-plugin-example', '0.0.0');

    // run the validation
    await validation.validate(context);

    const report = context.report.toJson();

    expect(report.violations.length).toEqual(0);

  });


});