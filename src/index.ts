import * as fs from 'fs';

// make sure to use "import type", as these are not needed at runtime
import type { Validation, ValidationContext } from 'cdk8s-cli';

import * as yaml from 'yaml';

// your plugin can accept properties. these are passed through
// via the cdk8s.yaml configuration file of your user.
export interface ExampleValidationProps {

  // for example, your plugin can accept an optional string to be
  // prefixed with each violation message.
  readonly messagePrefix?: string;

}

// this is the entry point of your plugin. this class
// will be instantiated by cdk8s and its name needs to provided
// by the user in the cdk8s.yaml configuration file.
export class ExampleValidation implements Validation {

  private readonly props: ExampleValidationProps;

  constructor(props: ExampleValidationProps = {}) {
    this.props = props;
  }

  public async validate(context: ValidationContext) {

    // run your validation code here.
    // for the sake of the example, lets say our plugin just validates
    // that the restart policy for deployments is always set to 'Always'

    let status: 'success' | 'failure' = 'success';

    for (const manifest of context.manifests) {

      // use the dedicated logger to log messages instead of `console.log`. this allows
      // the cdk8s framework to have control on user output.
      context.logger.log(`validating manifest: ${manifest}`);

      const parsed = yaml.parse(fs.readFileSync(manifest, { encoding: 'utf-8' }));
      const resources = Array.isArray(parsed) ? parsed : [parsed];
      for (const resource of resources) {
        if (resource.kind === 'Deployment' && resource.spec.template.spec.restartPolicy !== 'Always') {

          // this is how we build the report, incrementally
          // adding violations to it.
          context.report.addViolation({
            resourceName: resource.metadata.name,
            message: `${this.props.messagePrefix ?? ''}Deployments should set the restartPolicy to 'Always'`,
            manifestPath: manifest,
          });

          // in our case every violation causes a validation failure
          // but that doesn't have to be the case - its up to the plugin
          // to determine if a validation is successful or not.
          status = 'failure';
        }
      }
    }

    // when you're done, you must submit the report with a status
    context.report.submit(status);
  }


}