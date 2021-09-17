import {
  NodejsFunction,
  NodejsFunctionProps,
} from "@aws-cdk/aws-lambda-nodejs";
import { Construct } from "@aws-cdk/core";
import { IFunction } from "@aws-cdk/aws-lambda";

export type FnConstructor = string | NodejsFunctionProps | IFunction;
export function makeFn(
  scope: Construct,
  path: string,
  constructor: FnConstructor
): IFunction {
  if (typeof constructor === "string") {
    return new NodejsFunction(scope, toId(`${path}-${noExt(constructor)}`), {
      entry: constructor,
    });
  } else if (isFn(constructor)) {
    return constructor;
  } else {
    return new NodejsFunction(
      scope,
      toId(
        [
          path,
          constructor.handler,
          constructor.entry ? noExt(constructor.entry) : undefined,
        ]
          .filter((x) => x)
          .join("-")
      ),
      constructor
    );
  }
}

function isFn(handler: any): handler is IFunction {
  return Object.keys(handler).includes("functionArn");
}

function noExt(handler: string): string {
  return handler.replace(/\..*$/g, "");
}

function toId(path: string): string {
  return path.replace(/[\/\-{}$%#&]/g, "-").replace(/^-/g, "");
}
