import * as child from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { withCwd, withTempDir } from './utils';

// these tests need an extended timeout since they
// actually invoke real cdk8s synth commands.
const timeout = 60 * 1000;

// test that our plugin properly interacts with the framework
// to report a validation failure.
test('validation properly reports failure', async () => {

  try {
    await synth('invalid-app');
  } catch (e: any) {
    expect(e.status).toEqual(2);
  }

}, timeout);

// test that our plugin properly interacts with the framework
// to report a validation success.
test('validation properly reports success', async () => {

  await synth('valid-app');

}, timeout);

// this function runs `cdk8s synth` on a given fixture.
// its implementation is somewhat complex because there's some preparation
// required for the cdk8s app to compile and recognize our plugin.
// we hope to simplify it, but in the meantime just copy paste it as is
// into your own project.
async function synth(fixture: string) {

  const fixturePath = path.join(__dirname, '__fixtures__', fixture);

  await withTempDir(async (dir: string) => {

    // never operate on source directories
    // better to create a temp copy.
    fs.copySync(fixturePath, dir);

    await withCwd(dir, async () => {

      // our project already declares these dependencies, so lets just
      // take them instead of installing new ones.
      const cdk8s = path.resolve(path.join(__dirname, '..', 'node_modules/.bin/cdk8s'));
      const kplus = path.join(require.resolve('cdk8s-plus-25'), '..', '..');
      const k = path.join(require.resolve('cdk8s'), '..', '..');

      // symlink cdk8s and cdk8s-plus-25 because our cdk8s app require it
      fs.mkdirpSync('node_modules');
      child.execSync(`ln -s ${kplus} cdk8s-plus-25`, { cwd: path.join(dir, 'node_modules') });
      child.execSync(`ln -s ${k} cdk8s`, { cwd: path.join(dir, 'node_modules') });

      // populate the cdk8s plugins directory with our plugin
      // so that it doesn't try to install it from npm.
      const me = path.join(require.resolve('..'), '..');
      const plugins = path.join(dir, '.cdk8s', 'plugins');
      const plugin = path.join(plugins, 'cdk8s-validation-plugin-example', '0.0.0', 'node_modules');
      fs.mkdirpSync(plugin);
      child.execSync(`ln -s ${me} cdk8s-validation-plugin-example`, { cwd: plugin });

      // run cdk8s synth in the directory of the invalid app.
      // we expect it command to fail with an exit code of 2,
      // as documented by the cdk8s-cli.
      child.execSync(`${cdk8s} synth`, {
        env: {
          ...process.env,

          // required so that 'ts-node' is available
          PATH: `${path.join(__dirname, '..', 'node_modules', '.bin')}:${process.env.PATH}`,

          // tell cdk8s to use a custom plugins directory (which we pre-populated)
          CDK8S_PLUGINS_DIR: plugins,
        },
        stdio: ['ignore', 'inherit', 'inherit'],
      });

    });

  });

}
