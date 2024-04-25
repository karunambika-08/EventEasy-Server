const { exist } = require('joi');
const dbData = require('../database/dbOperations')

let createUserTable = ()=>{
    dbData.createTable('UserDetails', {
    TableName: 'UserDetails',
    AttributeDefinitions: [
        {
            AttributeName: "email",
            AttributeType: "S"
        },
    ],
    KeySchema: [
        {
            AttributeName: "email",
            KeyType: "HASH",
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    },
})
}


createUserTable()
