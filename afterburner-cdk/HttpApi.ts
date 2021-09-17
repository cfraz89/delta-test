import {
  AddRoutesOptions,
  HttpApi,
  HttpMethod,
  HttpRoute,
} from "@aws-cdk/aws-apigatewayv2";
import {
  LambdaProxyIntegration,
  LambdaProxyIntegrationProps,
} from "@aws-cdk/aws-apigatewayv2-integrations";
import { IFunction } from "@aws-cdk/aws-lambda";
import { FnConstructor, makeFn } from "./function";

export interface RouteParams {
  methods?: [HttpMethod];
  handler: FnConstructor;
  options?: RouteOptions;
}

export interface RouteOptions {
  route?: AddRoutesOptions;
  lambdaProxyIntegration?: LambdaProxyIntegrationProps;
}

export type HttpRouteHandler = {
  handler: IFunction;
  routes: HttpRoute[];
};
export function route(
  api: HttpApi,
  routes: Record<string, string | RouteParams | RouteParams[]>
) {
  const handlers = Object.entries(routes).map(
    ([path, r]): [string, HttpRouteHandler[]] => {
      const routeParams = extractRouteParams(r);
      return [
        path,
        routeParams.map((rp) => {
          const handler = makeFn(api.stack, path, rp.handler);
          return {
            handler,
            routes: api.addRoutes({
              methods: rp.methods,
              path: path,
              integration: new LambdaProxyIntegration({
                handler,
                ...rp.options?.lambdaProxyIntegration,
              }),
              ...rp.options?.route,
            }),
          };
        }),
      ];
    }
  );
  return Object.fromEntries(handlers);
}

function isRouteParams(r: any): r is RouteParams {
  return Object.keys(r).includes("handler");
}

function extractRouteParams(
  r: string | RouteParams | RouteParams[]
): RouteParams[] {
  if (typeof r === "string") {
    return [{ handler: r }];
  } else {
    return isRouteParams(r) ? [r] : r;
  }
}
