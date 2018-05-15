import { DynamoDB, FileSystemCredentials } from "aws-sdk"
import { SchemaExtensionStatus } from "aws-sdk/clients/directoryservice"
import {
  GraphQLSchema,
  graphql,
  parse,
  GraphQLNamedType,
  GraphQLField
} from "graphql"
import { TypeMap } from "graphql/type/schema"

export type MappingConfiguration = {
  [key: string]: ResolverMappingTemplate
}

type ResolverMappingTemplate = {
  [key: string]: any
  kind: string
}

type Resolvers = {
  [key: string]: Function
}

export type ClientDefinition = {
  client: any
  type: string
  resolver: Function
}

// needed to add the index signature to dynamically access methods
export interface GraphQLParams {
  [index: string]: string | null | undefined | { [name: string]: any } | boolean
  query: string | null | undefined
  variables: { [name: string]: any } | null | undefined
  operationName: string | null | undefined
  raw: boolean | null | undefined
}

type ResolverMapping = { [key: string]: Function }

type Schema = {
  [key: string]: string | object
}

const DynamoResolver = (
  key: string,
  client: DynamoDB,
  field: GraphQLField<any, any>,
  table: string,
  isMutation: boolean,
  requestParams: any,
  response: Response
) =>
  new Promise((resolve, reject) => {
    // use projection expression

    console.log(requestParams)

    const dynamoKeys = DynamoDB.Converter.marshall(requestParams)

    console.log(dynamoKeys)

    if (isMutation) {
      client.putItem(
        {
          TableName: table,
          Item: dynamoKeys
        },
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    } else {
      client.getItem(
        {
          TableName: table,
          Key: dynamoKeys
        },
        (err, result) => {
          if (err || !result.Item) {
            reject(err)
          } else {
            const item = DynamoDB.Converter.unmarshall(result.Item)
            resolve(item)
          }
        }
      )
    }
  })

export const buildResolver = (
  client: DynamoDB,
  schema: GraphQLSchema,
  tableMapping: { [key: string]: string }
): ResolverMapping => {
  const finalMapping: ResolverMapping = {}

  const schemaTypes: TypeMap = schema.getTypeMap()

  console.log(schemaTypes)

  const queryType = schema.getQueryType()

  if (queryType) {
    const fields = queryType.getFields()
    Object.keys(fields).forEach(key => {
      const tableType = fields[key].type.toString()
      finalMapping[key] = DynamoResolver.bind(
        null,
        key,
        client,
        fields[key],
        tableMapping[tableType],
        false
      )
    })
  }

  const mutationType = schema.getMutationType()

  if (mutationType) {
    const fields = mutationType.getFields()
    console.log(fields)

    Object.keys(fields).forEach(key => {
      const tableType = fields[key].type.toString()
      finalMapping[key] = DynamoResolver.bind(
        null,
        key,
        client,
        fields[key],
        tableMapping[tableType],
        true
      )
    })
  }

  console.log(finalMapping)

  return finalMapping
}
