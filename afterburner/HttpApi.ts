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
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "@aws-cdk/aws-lambda-nodejs";
import * as lambda from "@aws-cdk/aws-lambda";
import { filter } from "jszip";

export interface RouteParams {
  methods?: [HttpMethod];
  handler: string | NodejsFunctionProps | lambda.IFunction;
  options?: RouteOptions;
}

export interface RouteOptions {
  route?: AddRoutesOptions;
  lambdaProxyIntegration?: LambdaProxyIntegrationProps;
}

export type HttpRouteHandler = {
  handler: lambda.IFunction;
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
          const handler = makeLambda(api, path, rp);
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

function extractRouteParams(
  r: string | RouteParams | RouteParams[]
): RouteParams[] {
  let routeParams: RouteParams[];
  if (typeof r === "string") {
    routeParams = [{ handler: r }];
  } else if (Object.keys(r).includes("handler")) {
    routeParams = [r as RouteParams];
  } else {
    routeParams = r as RouteParams[];
  }
  return routeParams;
}

function makeLambda(api: HttpApi, path: string, rp: RouteParams) {
  let handler: lambda.IFunction | undefined;
  if (typeof rp.handler === "string") {
    handler = new NodejsFunction(
      api.stack,
      toId(`${path}-${noExt(rp.handler)}`),
      {
        entry: rp.handler,
      }
    );
  } else if (Object.keys(rp.handler).includes("functionArn")) {
    handler = rp.handler as lambda.IFunction;
  } else {
    const handlerProps = rp.handler as NodejsFunctionProps;
    handler = new NodejsFunction(
      api.stack,
      toId(
        [
          path,
          handlerProps.entry ? noExt(handlerProps.entry) : undefined,
          handlerProps,
        ]
          .filter((x) => x)
          .join("-")
      ),
      rp as NodejsFunctionProps
    );
  }
  return handler;
}

function noExt(handler: string): string {
  return handler.replace(/\..*$/g, "");
}

function toId(path: string): string {
  return path.replace(/[\/\-{}$%#&]/g, "-").replace(/^-/g, "");
}
