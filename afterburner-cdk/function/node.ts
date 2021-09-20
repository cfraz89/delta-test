import {
  NodejsFunction,
  NodejsFunctionProps,
} from "@aws-cdk/aws-lambda-nodejs";
import { Construct } from "@aws-cdk/core";
import { IFunction } from "@aws-cdk/aws-lambda";
import { isIFunction, noExt, toId } from "./lib";

export type NodeFunctionConstructor = string | NodejsFunctionProps | IFunction;
export function nodeFunction(
  scope: Construct,
  path: string,
  constructor: NodeFunctionConstructor
): IFunction {
  if (typeof constructor === "string") {
    return new NodejsFunction(scope, toId(`${path}-${noExt(constructor)}`), {
      entry: constructor,
    });
  } else if (isIFunction(constructor)) {
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
