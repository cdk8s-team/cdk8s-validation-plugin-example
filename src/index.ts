import * as fs from 'fs';

// make sure to use "import type", as these are not needed at runtime
import type { Validation, ValidationContext, ValidationViolatingResource } from 'cdk8s-cli/plugins';

import * as yaml from 'yaml';

// your plugin can accept properties. these are passed through
// via the cdk8s.yaml configuration file of your user.
export interface ExampleValidationProps {

  // for example, your plugin can accept an optional list of resource
  // kinds to ignore
  readonly ignoreKinds?: string[];

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

    const violatingResources: ValidationViolatingResource[] = [];

    for (const manifest of context.manifests) {

      // use the dedicated logger to log messages instead of `console.log`. this allows
      // the cdk8s framework to have control on user output.
      context.logger.log(`validating manifest: ${manifest}`);

      const parsed = yaml.parseAllDocuments(fs.readFileSync(manifest, { encoding: 'utf-8' }));
      const resources = Array.isArray(parsed) ? parsed : [parsed];

      for (const raw of resources) {
        const resource = raw.toJS();
        if (!(this.props.ignoreKinds ?? []).includes(resource.kind)
          && resource.kind === 'Deployment'
          && resource.spec.template.spec.restartPolicy !== 'Always') {

          // accumulate the resources that violate the rule
          violatingResources.push({
            resourceName: resource.metadata.name,
            locations: ['spec.template.spec.restartPolicy'],
            manifestPath: manifest,
          });
        }
      }
    }

    // if any violating resources are found, add a violation
    // to the report.
    if (violatingResources.length > 0) {
      context.report.addViolation({
        ruleName: 'Ensure deployment-like resource is using a valid restart policy',
        recommendation: 'Incorrect value for key `restartPolicy` - any other value than `Always` is not supported by this resource',
        violatingResources: violatingResources,
        fix: 'https://hub.datree.io/built-in-rules/ensure-valid-restart-policy',
      });
    }

    // when you're done, you must submit the report with a status
    // in our case every violation causes a validation failure
    // but that doesn't have to be the case - its up to the plugin
    // to determine if a validation is successful or not.
    context.report.submit(violatingResources.length > 0 ? 'failure' : 'success');
  }


}