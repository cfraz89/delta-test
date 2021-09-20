import {
  BaseDataSource,
  GraphqlApi,
  Resolver,
  Schema,
} from "@aws-cdk/aws-appsync";
import { nodeFunction, NodeFunctionConstructor } from "./function/node";

type GraphqlType = "Query" | "Mutation";
type Wiring = Record<GraphqlType, TypeHandler>;
type TypeHandler = Record<string, FieldHandler>;
type FieldHandler = { node: NodeFunctionConstructor };
type WiringOutput = Record<
  GraphqlType,
  Record<string, { dataSource: BaseDataSource; resolver: Resolver }>
>;
export function wire(api: GraphqlApi, wiring: Wiring): WiringOutput {
  const output: WiringOutput = { Query: {}, Mutation: {} };
  Object.entries(wiring).forEach(([type, typeHandler]) => {
    Object.entries(typeHandler).forEach(([field, fieldHandler]) => {
      const dataSource = api.addLambdaDataSource(
        `${type}-${field}`,
        nodeFunction(api.stack, `${type}-${field}`, fieldHandler.node)
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
