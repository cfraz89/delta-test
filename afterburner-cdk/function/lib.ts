import { IFunction } from "@aws-cdk/aws-lambda";
export function isIFunction(handler: any): handler is IFunction {
  return Object.keys(handler).includes("functionArn");
}

export function noExt(handler: string): string {
  return handler.replace(/\..*$/g, "");
}

export function toId(path: string): string {
  return path.replace(/[\/\-{}$%#&]/g, "-").replace(/^-/g, "");
}
