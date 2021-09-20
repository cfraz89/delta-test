import {
  AddRoutesOptions,
  HttpApi,
  HttpMethod,
  HttpRoute,
  IHttpRouteIntegration,
} from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { Construct } from "@aws-cdk/core";
import { makeFn } from "./function";

export type RouteOptions = Omit<AddRoutesOptions, "path" | "methods">;
export type Method = keyof typeof HttpMethod;
export type MethodHandler = string | IHttpRouteIntegration | RouteOptions;
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
  return typeof r === "object" && "handler" in r;
}

function addRoutesOptions(
  scope: Construct,
  path: string,
  method: Method,
  handler: MethodHandler
): AddRoutesOptions {
  if (isRouteOptions(handler)) {
    return { path, methods: [HttpMethod[method]], ...handler };
  } else if (typeof handler === "string") {
    return {
      path,
      methods: [HttpMethod[method]],
      integration: new LambdaProxyIntegration({
        handler: makeFn(scope, path, handler),
      }),
    };
  } else {
    return { path, methods: [HttpMethod[method]], integration: handler };
  }
}
