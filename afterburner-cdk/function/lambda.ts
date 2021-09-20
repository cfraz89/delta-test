import { Function, FunctionProps, IFunction } from "@aws-cdk/aws-lambda";
import { Construct } from "@aws-cdk/core";
import { isIFunction, noExt, toId } from "./lib";

export type LambdaFunctionConstructor = FunctionProps | IFunction;
export function lambdaFunction(
  scope: Construct,
  path: string,
  constructor: LambdaFunctionConstructor
): IFunction {
  if (isIFunction(constructor)) {
    return constructor;
  } else {
    return new Function(
      scope,
      toId([path, constructor.handler].filter((x) => x).join("-")),
      constructor
    );
  }
}
