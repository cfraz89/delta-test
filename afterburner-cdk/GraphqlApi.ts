import { BaseDataSource, GraphqlApi, Resolver } from "@aws-cdk/aws-appsync";
import { IFunction } from "@aws-cdk/aws-lambda";
import { Stack } from "@aws-cdk/core";

type GraphqlType = "Query" | "Mutation";
type Routing = Record<GraphqlType, TypeHandler>;
type TypeHandler = Record<string, FieldHandler>;
type FieldHandler = { lambda: (stack: Stack, path: string) => IFunction };
type RoutingOutput = Record<
  GraphqlType,
  Record<string, { dataSource: BaseDataSource; resolver: Resolver }>
>;
export function add(api: GraphqlApi, routing: Routing): RoutingOutput {
  const output: RoutingOutput = { Query: {}, Mutation: {} };
  Object.entries(routing).forEach(([type, typeHandler]) => {
    Object.entries(typeHandler).forEach(([field, fieldHandler]) => {
      let dataSource: BaseDataSource;
      const path = `${type}-${field}`;
      dataSource = api.addLambdaDataSource(
        `${path}-datasource`,
        fieldHandler.lambda(api.stack, path)
      );
      const resolver = dataSource.createResolver({
        typeName: type,
        fieldName: field,
      });
      output[type as GraphqlType][field] = { dataSource, resolver };
    });
  });
  return output;
}
