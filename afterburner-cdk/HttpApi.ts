import {
  AddRoutesOptions,
  HttpApi,
  HttpMethod,
  HttpRoute,
  IHttpRouteIntegration,
} from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { Stack } from "@aws-cdk/core";
import { IFunction } from "@aws-cdk/aws-lambda";

export type RouteOptions = Omit<AddRoutesOptions, "path" | "methods">;
export type Method = keyof typeof HttpMethod;
export type MethodHandler = IHttpRouteIntegration | RouteOptions;
export type RouteHandler = Partial<Record<Method, MethodHandler>>;

export function route(api: HttpApi, routes: Record<string, RouteHandler>) {
  const handlers: Record<string, Partial<Record<Method, HttpRoute>>> = {};
  Object.entries(routes).forEach(([path, routeHandler]) =>
    Object.entries(routeHandler).forEach(([method, methodHandler]) => {
      const options = addRoutesOptions(
        api.stack,
        path,
        method as Method,
        methodHandler
      );
      const handler = api.addRoutes(options)[0];
      if (handlers[path]) {
        handlers[path][method as Method] = handler;
      } else {
        handlers[path] = { [method]: handler };
      }
    })
  );
  return handlers;
}

function isRouteOptions(r: MethodHandler): r is RouteOptions {
  return "handler" in r;
}

function addRoutesOptions(
  stack: Stack,
  path: string,
  method: Method,
  handler: MethodHandler
): AddRoutesOptions {
  if (isRouteOptions(handler)) {
    return { path, methods: [HttpMethod[method]], ...handler };
  }
  return { path, methods: [HttpMethod[method]], integration: handler };
}

export function lambda(
  integration: (stack: Stack, path: string) => IFunction
): (stack: Stack, path: string) => LambdaProxyIntegration {
  return (stack, path) =>
    new LambdaProxyIntegration({ handler: integration(stack, path) });
}
