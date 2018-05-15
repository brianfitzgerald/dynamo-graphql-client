"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const DynamoResolver = (key, client, field, table, isMutation, requestParams, response) => new Promise((resolve, reject) => {
    // use projection expression
    console.log(requestParams);
    const dynamoKeys = aws_sdk_1.DynamoDB.Converter.marshall(requestParams);
    console.log(dynamoKeys);
    if (isMutation) {
        client.putItem({
            TableName: table,
            Item: dynamoKeys
        }, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    }
    else {
        client.getItem({
            TableName: table,
            Key: dynamoKeys
        }, (err, result) => {
            if (err || !result.Item) {
                reject(err);
            }
            else {
                const item = aws_sdk_1.DynamoDB.Converter.unmarshall(result.Item);
                resolve(item);
            }
        });
    }
});
exports.buildResolver = (client, schema, tableMapping) => {
    const finalMapping = {};
    const schemaTypes = schema.getTypeMap();
    console.log(schemaTypes);
    const queryType = schema.getQueryType();
    if (queryType) {
        const fields = queryType.getFields();
        Object.keys(fields).forEach(key => {
            const tableType = fields[key].type.toString();
            finalMapping[key] = DynamoResolver.bind(null, key, client, fields[key], tableMapping[tableType], false);
        });
    }
    const mutationType = schema.getMutationType();
    if (mutationType) {
        const fields = mutationType.getFields();
        console.log(fields);
        Object.keys(fields).forEach(key => {
            const tableType = fields[key].type.toString();
            finalMapping[key] = DynamoResolver.bind(null, key, client, fields[key], tableMapping[tableType], true);
        });
    }
    console.log(finalMapping);
    return finalMapping;
};
