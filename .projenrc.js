const { typescript } = require('projen');
const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'cdk8s-validation-plugin-example',

  repositoryUrl: 'https://github.com/cdk8s-team/cdk8s-validation-plugin-example.git',
  description: 'This is an example project for implementing cdk8s validation plugins',
  authorName: 'Amazon Web Services',
  authorUrl: 'https://aws.amazon.com',
  minNodeVersion: '14.18.0',

  devDeps: [

    // provides the validation interface you plugin needs
    // to implement. required only at compile time, which is why
    // its just a dev dependency.
    'cdk8s-cli',

    // used in integration tests to author a cdk8s application.
    'cdk8s',
    'cdk8s-plus-24',
    'constructs',
    'ts-node',

    // just utility stuff for tests
    'fs-extra',
    '@types/fs-extra',
  ],

  deps: [
    // specific dependency of our plugin.
    // you can use any dependency you like.
    'yaml',
  ],

  autoApproveOptions: {
    allowedUsernames: ['cdk8s-automation'],
    secret: 'GITHUB_TOKEN',
  },
  autoApproveUpgrades: true,

});

// the cdk8s-cli uses the "exports" directive in package.json
// to restrict the modules that can be imported from it.
// we need to add this config so that typescript detects it.
// see https://www.typescriptlang.org/docs/handbook/esm-node.html
// see https://www.typescriptlang.org/docs/handbook/esm-node.html#packagejson-exports-imports-and-self-referencing
project.tsconfig.compilerOptions.moduleResolution = 'nodenext';
project.tsconfigDev.compilerOptions.moduleResolution = 'nodenext';

project.gitignore.exclude('.vscode/');

// we add a task to run the integration tests. they cannot be executed
// along with unit tests because they require compiling the source code.
const integ = project.addTask('integ');
integ.exec('jest --testPathIgnorePatterns "^((?!integ).)*$" --passWithNoTests --all --updateSnapshot --coverageProvider=v8');

// we need to compile first because cdk8s will need to load the plugin
// as part of the integ tests, so the .js files need to be available.
integ.prependSpawn(project.compileTask);

// we need to change the standard test command so that it doesn't
// run integration tests
project.testTask.reset('jest --testPathIgnorePatterns ".*integ.*" --passWithNoTests --all --updateSnapshot --coverageProvider=v8');
project.testTask.spawn(project.tasks.tryFind('eslint'));

// add the integration tests just before we package everything up.
project.packageTask.prependSpawn(integ);

project.synth();