import * as express from "express"
import { config, Lambda } from "aws-sdk"
import { parseParams, ClientDefinition, GraphQLParams } from ".."

export type JSONMappingTemplate = {
  [key: string]: string | object
  kind: "JSON"
  operation: "Get"
  query: JSONQuery
}

type JSONQuery = { [key: string]: boolean | string | number }

const Resolver = (
  mappingParams: JSONMappingTemplate,
  Client: any,
  requestParams: GraphQLParams,
  response: express.Response
) =>
  new Promise((resolve, reject) => {
    const parsedParams = parseParams(mappingParams, requestParams)
    if (mappingParams.operation === "Get") {
      if (Array.isArray(Client)) {
        const item = Client.find(item => {
          let isItem = true
          Object.keys(parsedParams.query).forEach(queryPart => {
            if (item[queryPart] !== parsedParams[queryPart]) {
              isItem = false
            }
          })
          return isItem
        })
        resolve(item)
      } else {
        let item
        Object.keys(Client).forEach(clientItem => {
          Object.keys(parsedParams.query).forEach(queryPart => {
            if (Client[clientItem][queryPart] !== parsedParams[queryPart]) {
              item = Client[clientItem]
              resolve(item)
            }
          })
        })
      }
      reject()
    }
  })

export const JSONResolver = (client: object): ClientDefinition => {
  return {
    type: "JSON",
    client,
    resolver: Resolver
  }
}
