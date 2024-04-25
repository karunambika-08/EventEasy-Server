const dbData = require('../database/dbOperations')
let createBookedAppointmentsTable = ()=>{
    dbData.createTable('AppointmentsDetails ,', {
        TableName: 'AppointmentsDetails',
        AttributeDefinitions: [
            {
                AttributeName: "appointmentId",
                AttributeType: "S"
            },
            {
                AttributeName: "attendeeId_eventId",
                AttributeType: "S"
            },
        ],
        KeySchema: [
            {
                AttributeName: "appointmentId",
                KeyType: "HASH",
            },
            {
                AttributeName: 'attendeeId_eventId',
                KeyType : "RANGE",
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        },
    })
}

createBookedAppointmentsTable();

