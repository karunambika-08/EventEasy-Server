#EventEasy Database Schema

## UserDetails Table

### Description
This table contains Information of the user in EventEasy Database 

### Attributes - Base Table

- `userId` (String): The unique Identifier string 
- `Email` (String) : The email of the user,
- `userName`  (String): The name of the user,
- `Password` (String) : Hashed Password,
- `Type`  (String): The type of the user
- `createdAt` (String): The user registered date
- `updatedAt` (String): The user information updated date
("eventsOwner",attendee)

### Example User Details Object

```javascript
{
    userId : "4fc84a67-b2bd-4824-812c-206abf596949",
    username : "Karunambika",
    useremail :  "karunambika@gmail.com",
    userPassword:"050987f93cb59aefb595bf7ba094510e08224d7885",
    userType : "eventsOwner",
}

```


### UserDetails Table Schema
 ```javascript
{
    TableName: 'UserDetails',
    AttributeDefinitions: [
        {
            AttributeName: "userId",
            AttributeType: "S"
        },
        {
            AttributeName: "userEmail",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "userId",
            KeyType: "HASH",
        }
    ],
     // Secondary Index Table 
    GlobalSecondaryIndexes: [
        {
            IndexName: 'UserEmailIndex',
            KeySchema: [
                {
                     AttributeName: 'userEmail', 
                     KeyType: 'HASH' 
                    }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    },
}
```


## EventsDetails Table

### Description
This table contains Information of the events created by the Event Owner in EventEasy Database


### Attributes - Base Table

- `eventId` (String): The event unique Identifier 
- `ownerId` (String) : The Id of owner of the event ,
- `eventName`  (String): The name of the event,
- `eventMail` (String) : The email of the event,
- `startDate`  (String): The event Start Date 
- `eventEndDate` (String): The event End Date 
- `appointmentDuration` (String): The appointment 
duration
- `createdAt` (String): The event created date
- `updatedAt` (String): The event information updated date
- `eventDays` (String): The array of objects on the event available days 
    - `eventDay`(String): Days of Week,
    - `appointmentStartTime`(String): The appointment start time,
    - `appointmentEndTime`(String): The appointment end time,
    - `intervalEnabled`(Boolean): If interval enabled true, else false,
    - `intervalStartTime` (String): The interval start time,
    - `intervalEndTime` (String): The interval end time

### Example Event Details Object

```javascript
{
eventId:"xeluyKk1",
ownerId:"RFqSRlG2",
eventName:"Guided Meditation",
eventMail:"heartfullnessway@gmail.com"
startDate:"2024-02-25",
endDate:"2024-03-29",
appoitmentDuration:"120",
eventDays:[
    {
    eventDay:"monday",
    startTime:"19:00",
    endTime:"23:00",
    intervalEnabled:true,
    intervalStartTime:"20:00",
    intervalEndTime:"20:15"
    }
]
}

```
### EventsDetails Table Schema
 ```javascript
{
    TableName: 'eventDetails',
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
        }
    ],
     // Secondary Index Table 
    GlobalSecondaryIndexes: [
        {
            IndexName: 'ownerIdIndex',
            KeySchema: [
                {
                    AttributeName: 'ownerId', 
                    KeyType: 'HASH' 
                }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    },
}
```



## BookedAppointments Table

### Description
This table contains Information of the Appointments book by the user in EventEasy Database

### Attributes - Base Table

- `appointmentId` (String): The unique Identifier of the appointment Booked
- `eventId` (String) : The event Id of the booked Appointment,
- `attendeeId`  (String): The userId of the user who booked the appointment,
- `appointmentDate` (String) : The appointment start date,
- `appointmentStartTime`  (String): The appointment start Time
- `appointmentEndTime` (String) : The appointmentt End Time
- `createdAt` (String): The Appointment created date
- `updatedAt` (String): The Appointment information updated date


### Example Booked Appointments Details
```javascript
{
    eventId: "bNB4Go4d", 
    attendeeId: "cV0ePUXl", 
    appointmentId : "tV0kPUxL",
    appointmentDate: "2024-02-26", 
    appointmentStartTime: "13:30",
    appointmentStartTime : "16:00"
}
```

### BookedAppointments Table Schema
 ```javascript
{
    TableName: 'BookedAppointmentsDetails',
    AttributeDefinitions: [
        {
            AttributeName: "appointmentId",
            AttributeType: "S"
        },
        {
            AttributeName: "eventId",
            AttributeType: "S"
        },
        {
            AttributeName: "userId",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "appointmentId",
            KeyType: "HASH",
        }
        {
            AttributeName: `${"userId"}#${"eventId"}`
        }
    ],
     // Secondary Index Table 
    GlobalSecondaryIndexes: [
        {
            IndexName: 'userIdIndex',
            KeySchema: [
                {
                     AttributeName: 'userId', 
                     KeyType: 'HASH' 
                },
                {
                    AttributeName: 'appointmentDate', 
                    KeyType: 'RANGE' 
                }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        },
        {
            IndexName: 'eventIdIndex',
            KeySchema: [
                {
                     AttributeName: 'eventId', 
                     KeyType: 'HASH' 
                },
                {
                    AttributeName: 'appointmentDate', 
                    KeyType: 'RANGE' 
                }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    },
}
```

Base Table:

Partition Key (HASH): ownerId
Sort Key (RANGE): eventId

GSI:

Partition Key (HASH): EventMonthYear  
# EventMonthYear - Need to create a data
Sort Key (RANGE): eventId or eventStartDate 

or 

Partition Key (HASH):  eventId
# EventMonthYear - Need to create a data
Sort Key (RANGE): eventStartDate - eventEndDate


Event Month Year (Event End date and Event Start Date might not fall in same month) //Doubt on how to get event based on date (or Month Year)


### Booked Appointments

Base Table:
Partition Key (HASH): userId
Sort Key (RANGE): eventId#appointmentId 


# ---> Another Way <---
Base Table:

Partition Key (HASH): userId
Sort Key (RANGE): appointmentId

GSI:
Partition Key (HASH): eventId
Sort Key (RANGE): appointmentDate