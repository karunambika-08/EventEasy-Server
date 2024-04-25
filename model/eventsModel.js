const dbData = require('../database/dbOperations')
let createEventsTable = ()=>{
    dbData.createTable('eventDetails', {
        TableName: 'EventDetails',
        AttributeDefinitions: [
            {
                AttributeName: "eventId",
                AttributeType: "S"
            },
            {
                AttributeName: "ownerId",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "eventId",
                KeyType: "HASH",
            },
            {
                AttributeName: "ownerId",
                KeyType: "RANGE",
            }
        ],
      
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        },
    })
}

createEventsTable();

