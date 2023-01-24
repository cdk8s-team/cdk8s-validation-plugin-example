# cdk8s-validation-plugin-example

An example implementation of a cdk8s validation plugin that can be used to validate cdk8s application
during the synthesis process.

This repository is meant to serve as an example for third-parties looking to implement their own plugin.
You'll find most information as inline comments in the source scattered around this repo. Here we're just
going to provide a high level overview of the project structure.

## What is the Plugin

A cdk8s validation plugin consists of:

1. An NPM installable package
2. An exported class inside the package that implements the `Validation` interface.

Users can validate the manifests synthesized by cdk8s via validation plugins using the `validations` property
in their configuration file (`cdk8s.yaml`). This new property will cause cdk8s to dynamically load (and install)
a plugin, and then invoke that plugin to produce a violation report.

For example, given the following `cdk8s.yaml` configuration file:

```yaml
language: typescript
app: ts-node main.ts
validations:
  - package: cdk8s-validation-plugin-example
    class: ExampleValidation
    version: 0.0.5
```

Instead, if the user has a local repository with the validations to test locally, they can validate the manifests synthesized by cdk8s via the plugins but, in the configuration file (`cdk8s.yaml`) for the `package` value within the  `validations` property we define the path to the 
local repository holding the validations.

For example, given the following `cdk8s.yaml` configuration file:

```yaml
language: typescript
app: ts-node main.ts
validations:
  - package: ~/<local-path>
    class: ExampleValidation
    version: 0.0.5
```

When running `cdk8s synth`, if some parts of the application violate the policy this plugin enforces, a
report will be printed, and the command will fail.

```console
Validation Report (cdk8s-validation-plugin-example@0.0.0)
---------------------------------------------------------

(Summary)

╔═════════╤═════════════════════════════════╗
║ Status  │ failure                         ║
╟─────────┼─────────────────────────────────╢
║ Plugin  │ cdk8s-validation-plugin-example ║
╟─────────┼─────────────────────────────────╢
║ Version │ 0.0.5                           ║
╚═════════╧═════════════════════════════════╝


(Violations)

Ensure deployment-like resource is using a valid restart policy (2 occurrences)

  Occurrences:

    - construct.path: N/A
    - manifest.path: dist/chart-c86185a7.k8s.yaml
    - resource.name: chart-deployment1-c874f36f
    - locations:
      > spec.template.spec.restartPolicy

    - construct.path: N/A
    - manifest.path: dist/chart-c86185a7.k8s.yaml
    - resource.name: chart-deployment2-c884ba93
    - locations:
      > spec.template.spec.restartPolicy

  Recommendation: Incorrect value for key `restartPolicy` - any other value than `Always` is not supported by this resource
  How to fix: https://hub.datree.io/built-in-rules/ensure-valid-restart-policy
```

## Creating the Project

The plugin project is a standard NodeJS/TypeScript project. We recommend using [projen](https://projen.io/) and TypeScript to
manage it (like this example does), but its up to you. This repository contains every configuration file you'll
need.

## Plugin Class

As mentioned before, the plugin project must export a class that implements the `Validation` interface from the `cdk8s-cli`.

**See [`index.ts`](./src/index.ts).**

## Unit Tests

There's nothing special about writing unit test for this specific project. Simply instantiate and invoke your plugin class
in unit tests to ensure your plugin behaves as expected.

**See [`index.test.ts`](./test/index.test.ts).**

## Integration Tests

Integration tests are intended to ensure your plugin implementation properly interacts with the cdk8s framework. It validates that:

- Your plugin implements the correct interface.
- Your plugin invokes the correct framework API to generate the report.
- Your plugin invokes the correct framework API to report the status of validation.

In order to do that, an integration test takes the form of a normal cdk8s application, that sets your plugin in the `validations` property
of the configuration file. The test then simply executes `cdk8s synth` on the application and inspects the result.
There are two pre-requisites that make running these tests a bit tricky:

- The plugin source code needs to be compiled to JavaScript. This is because cdk8s needs to dynamically load it as part of synthesis.
For JavaScript projects, this is trivial, but for TypeScript projects, it means these cannot be executed alongside unit tests<sup>*</sup>
- The plugin needs to be published to NPM. This is because cdk8s will try to install it from there during synthesis<sup>**</sup>.
This of course poses a problem because we don't want to publish our code before testing it.

> <sup>*</sup> This does not have to be the case if your unit tests are already running after compilation.
>
> <sup>**</sup> One could reference the plugin as a relative local path, but it complicates the dynamic loading and doesn't emulate
the same conditions your users will encounter.

This example project takes special measures to comply with these requirements. If your project is a TypeScript projen project,
you should be able to just copy paste the setup code from this example. If not, you'll need to craft your own setup,
though the code and comments provided in this codebase should help you get there fairly easily.

**See [`validate.integ.test.ts`](./test/validate.integ.test.ts)**

> Note that in this setup, integration tests file names must include the string `integ`.

## Linking the cdk8s cli

In case you'd like to test developer your plugin against a `cdk8s-cli` version that hasn't been published,
i.e against its source directly, follow these instructions:

```bash
git clone <cdk8s-cli-git-url> # can either be your fork, or an https url to original repo
cd cdk8s-cli
yarn install --frozen-lockfile
yarn build
yarn link # creates a link for yarn to be able to reference in other projects.
yarn watch # automatically compile to JS on changes
```

Now, in your plugins project directory run `yarn link cdk8s-cli`. You can then make any changes to the cdk8s-cli code and
they will be automatically reflected.

## Publishing

As mentioned before, your plugin needs to be published to an NPM registry so that `cdk8s` will be able to install it at runtime.
The NPM registry can either be the public one, or any private ones you are maintaining<sup>*</sup>.

There are no special requirements from your plugin with relation to packaging and publishing. Just follow your normal procedures.
If you're using projen, see [publishing](https://projen.io/publisher.html).

> <sup>*</sup> Your users will have to set the `installEnv` key in their configuration file.
> See [Private Validation Plugins](https://cdk8s.io/docs/latest/cli/synth/#private-validation-plugins).
