const express = require('express');
const dbOperations = require('../database/dbOperations');
const appointmentController = require('../controllers/appointmentsController')
const { v4: uuid } = require('uuid')
const { validateEvent, validateEditEvent } = require('../util/validation')
const moment = require('moment');


/**
 * Adding New Event Created by Owner to the databae
 * @param {*} req request data from the server
 * @param {object} res resposone to the server 
 * @param {*} next 
 */
function addNewEvent(req, res, next) {
    const { error, value } = validateEvent(req.body)
    if (error) {
        console.log(error);
        return res.send(error.details);
    }
    // Add the unqiue EventID to the req.body
    function appendEventId() {
        let eventId = uuid();
        let eventData = value
        eventData.eventId = eventId
        eventData.createdAt = moment().valueOf();
        eventData.updatedAt = moment().valueOf();
        return eventData
    }
    let newEventData = appendEventId()
    addEventToTable(newEventData)
    res.status(200).json({
        eventId: newEventData.eventID,
        eventName: newEventData.eventName
    })

}
/**
 * 
 * @param {object} eventDetails Events data as object
 * @returns database
 */
async function addEventToTable(eventDetails) {
    try {
        let eventDataParams = {
            TableName: 'EventDetails',
            Item: eventDetails
        }
        let dbresponse = await dbOperations.addItemInTable('EventDetails', eventDataParams);
        console.log("Add DB Response: ", dbresponse);
        return dbresponse;

    }
    catch (error) {
        return 'Error adding event'
    }
}

/**
 * Get a specific event from the database
 * @param {*} req Take eventId from the request body
 * @param {*} res eventDetails based on Id
 */
async function getAnEventData(req, res) {
    let getEventDataParams = {
        TableName: 'EventDetails',
        KeyConditionExpression: "eventId = :eventId ",
        ProjectionExpression: "eventId,ownerId,eventName, appointmentDuration, startDate, endDate,eventDays,eventMail",
        ExpressionAttributeValues: {
            ":eventId": req.params.id,
        }
    };
    // Database Call
    await dbOperations.queryItemsinTable(getEventDataParams)
        .then((items) => {
            console.log("----------Items---------", items);
            return res.status(200).json(
                items.Items[0]
            )
        })
        .catch((error) => {
            return res.status(400).send(error.message);
        });
}





/**
 * Getting all the events Created by a specified owner 
 * @param {*} req use the ownerID in request body
 * @param {*} res return the event count and details of th event based 'ownerId' in request 
 */
async function getCurrentOwnerEvents(req, res) {
    let currentDate = moment().valueOf();
    let endDateQuery;
    if (req.params.type == "ongoing") {
        endDateQuery = "#endDate >= :currentDate";
    }
    else {
        endDateQuery = "#endDate <= :currentDate";
    }

    let onGoingEvents = {
        TableName: 'EventDetails',
        FilterExpression: `#ownerId = :ownerId AND ${endDateQuery}`,
        ExpressionAttributeNames: { "#endDate": "endDate", "#ownerId": "ownerId" },
        ExpressionAttributeValues: {
            ":ownerId": req.params.id,
            ":currentDate": currentDate
        }

    }

    await dbOperations.scanItemsinTable(onGoingEvents)
        .then((items) => {
            console.log("Items Count", items.ScannedCount);
            if (items.length > 0) {
                return res.status(200).json(
                    items);
            }
            else {
                return res.status(200).json([])
            }

        })
        .catch((err) => {
            return res.status(500).send(err.message);
        });
}




//Function to handle slot booking by the attendee
async function slotBooking(req, res) {
    console.log("Ongoing slot booking");
    let eventId = req.params.id;
    if (eventId === undefined) {
        return res.status(404)
    }
    let appointmentDate = moment(req.params.selectedDate).valueOf();
    let eventDetailsParams = {
        TableName: 'EventDetails',
        KeyConditionExpression: "eventId = :eventId ",
        ProjectionExpression: "eventId,ownerId,eventName,appointmentDuration, startDate, endDate,eventDays",
        ExpressionAttributeValues: {
            ":eventId": eventId,
        }
    };
    await dbOperations.queryItemsinTable(eventDetailsParams)

        .then(async (items) => {
            if (items) {
                console.log(items);
                let eventDetails = items.Items[0]
                let appoitmentDetails = await slotPreparation(eventDetails, appointmentDate);
                console.log(appoitmentDetails);
                if (appoitmentDetails) {
                    return res.status(200).json(appoitmentDetails)
                } else {
                    return res.status(200).json([])
                }
            }
        })
        .catch(err => {
            console.log("Err", err);
            return res.status(500)
        })

}

//Function to prepare the slot for the event
async function slotPreparation(eventDetails, selectedDate) {
    let eventStartDate = moment(eventDetails.startDate).valueOf();
    let eventEndDate = moment(eventDetails.endDate).valueOf();
    let appointmentDuration = eventDetails.appointmentDuration;
    let selectedDay = moment(selectedDate).format('dddd').toLowerCase();
    let selectedDateDetails = eventDetails.eventDays.find(day => day.eventDay == selectedDay)
    if (selectedDateDetails) {
        let eventStartTime = moment(selectedDateDetails.startTime);
        
        let eventEndTime = moment(selectedDateDetails.endTime);
        let appointmentStartTime = eventStartTime;
        let appointments = [];
        if (selectedDate >= eventStartDate && selectedDate <= eventEndDate) {
            while (appointmentStartTime.isBefore(eventEndTime)) {
                let appointmentEndTime = appointmentStartTime.clone().add(appointmentDuration, 'minutes');
                if (selectedDateDetails.intervalEnabled === true) {
                    let intervalStartTime = moment(selectedDateDetails.intervalStartTime);
                    let intervalEndTime = moment(selectedDateDetails.intervalEndTime);
                    if (appointmentStartTime.isSameOrBefore(intervalStartTime) && appointmentEndTime.isSameOrAfter(intervalEndTime)) {
                        appointmentStartTime = intervalEndTime;
                        appointmentEndTime = appointmentStartTime.clone().add(appointmentDuration, 'minutes');
                    }
                }
                if (appointmentEndTime <=
                    eventEndTime) {
                    appointments.push({
                        appointmentStartTime: moment(appointmentStartTime).valueOf(),
                        appointmentEndTime: moment(appointmentEndTime).valueOf(),
                    });
                }
                appointmentStartTime = appointmentStartTime.clone().add(appointmentDuration, 'minutes');
            }
            console.log("Appointments-->", appointments)
            let updatedAppointmentList = await removeBookedAppointment(appointments, eventDetails, selectedDate) || [];
            if (updatedAppointmentList.length >= 1) {
                return updatedAppointmentList;
            }
            else {
                return [];
            }
        }
        else {
            return []
        }


    }
    else {
        return false
    }

}


//Function to remove booked appointment from the slot prepared 
async function removeBookedAppointment(appointments, eventDetails, selectedDate) {
    try {
        let eventId = eventDetails.eventId;
        let result = await getEventAppointment(selectedDate, eventId);
        console.log("Result", result);
        if (result.length > 0) {
            function removeAppointment() {
                let updatedAppointments = appointments.filter(function (cv) {
                    return !result.find(function (e) {
                        return e.appointmentStartTime === cv.appointmentStartTime;
                    })
                })
                return updatedAppointments;
            }
            return removeAppointment()
        }
        else {
            return appointments;
        }
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}


async function getEventAppointment(selectedDate, eventId) {

    try {
        let bookedAppointment = {
            TableName: 'AppointmentsDetails',
            FilterExpression: `contains(attendeeId_eventId, :eventId) AND #appointmentDate = :appointmentDate`,
            ProjectionExpression: 'appointmentStartTime, appointmentEndTime',
            ExpressionAttributeNames: { "#appointmentDate": "appointmentDate" },
            ExpressionAttributeValues: {
                ":eventId": eventId,
                ":appointmentDate": selectedDate
            }
        };

        return await dbOperations.scanItemsinTable(bookedAppointment);
    } catch (error) {
        console.error("Error:", error);
        throw error; // Re-throw the error to be caught by the caller
    }
}


/**
 * Getting all the items from the table
 * @param {*} req 
 * @param {*} res Returns Events Availalbe in Table
 * @param {*} next 
 */

async function scanAllEventsDateForMonth(req, res, next) {
    const { monthYear, eventId } = req.params;


    // To validate the format of 'month-Year'
    if (!moment(monthYear, 'YYYY-MM').isValid()) {
        return res.status(400).send("Invalid month and year format. Please use 'YYYY-MM'.");
    }

    const [year, month] = monthYear.split('-');
    const startOfMonth = moment({ year, month: month - 1 }).startOf('month').valueOf();
    const endOfMonth = moment({ year, month: month - 1 }).endOf('month').valueOf();

    const scanParams = {
        TableName: "EventDetails",
        FilterExpression: '(#startDate BETWEEN :startOfMonth AND :endOfMonth) OR (#endDate BETWEEN :startOfMonth AND :endOfMonth)',
        ExpressionAttributeNames: {
            "#endDate": "endDate",
            "#startDate": "startDate"
        },
        ExpressionAttributeValues: {
            ":startOfMonth": startOfMonth,
            ":endOfMonth": endOfMonth
        },
        ProjectionExpression: "eventId,eventName,appointmentDuration,startDate,endDate,eventDays"
        // totalSegment: 4
    }
    // Database Call
    await dbOperations.scanItemsinTable(scanParams)
        .then((items) => {
            if (items.length > 0) {
                let eventData = items;
                if (eventId) {
                    // If eventId is provided, filter the items to get the specific event
                    eventData = [items.find(event => event.eventId === eventId)];
                    if (!eventData) {
                        return res.status(404).json({ message: `Event with ID ${eventId} not found for ${monthYear}` });
                    }
                }

                const eventsForMonth = [];
                const daysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();// Get the number of days in the month
                console.log("Day In month:", daysInMonth);
                for (let day = startOfMonth; day <= endOfMonth; day += 86400000) {
                    console.log("Start of day:", day);
                    const formattedDate = `${day}`;
                    const eventsForDate = getEventsForMonth(eventData, formattedDate);
                    if (eventsForDate.length > 0) {
                        eventsForMonth.push(formattedDate);
                    }
                }
                console.log("Event on date:", eventsForMonth);
                return res.status(200).json(eventsForMonth)
            }
            else {
                return res.status(200).json([])
            }
        })
        .catch((err) => {
            return res.status(404).json({
                error: err,
                message: "Error in retrieving Data from Database"
            });
        })
}



function getEventsForMonth(eventList, date) {
    const selectedDate = parseInt(date); // Parse the input date as integer
    if (isNaN(selectedDate)) {
        console.error("Invalid epoch format:", date);
        return [];
    }

    // Filter events based on the selected date falling within the event's start and end dates
    let filteredEvents = eventList.filter(event => {
        const startDate = event.startDate;
        const endDate = event.endDate;
        return startDate <= selectedDate && endDate >= selectedDate;
    });
    console.log("Filter", filteredEvents);
    // Get the day index of the selected date
    const selectedDayIndex = moment(selectedDate).format('dddd').toLowerCase();

    // Filter events for the selected day
    const eventsForSelectedDay = filteredEvents.filter(event => {
        return event.eventDays.some(day => day.eventDay.toLowerCase() === selectedDayIndex);
    });

    console.log("Events for Month (Epoch format)", eventsForSelectedDay);
    return eventsForSelectedDay;
}


//Function to get event data
async function getEvents(req, res) {
    const currentDate = moment().valueOf()

    const scanParams = {
        TableName: "EventDetails",
        FilterExpression: '(#startDate <= :currentDate AND #endDate >= :currentDate)',
        ExpressionAttributeNames: {
            "#endDate": "endDate",
            "#startDate": "startDate"
        },
        ExpressionAttributeValues: {
            ":currentDate": currentDate,
        },
    }
    // Database Call
    await dbOperations.scanItemsinTable(scanParams)
        .then((items) => {
            
            if (items.length > 0) {
                items.sort((a, b) => {
           
                    const dateA = new Date(a.startDate);
                    const dateB = new Date(b.startDate);
                   
                    if (dateA < dateB) return -1;
                    if (dateA > dateB) return 1;
                   
                    if (a.startDate < b.startDate) return -1;
                    if (a.startDate > b.startDate) return 1;
                    return 0;
                });
                return res.status(200).json(items)
            }
            else {
                return res.status(200).json([])
            }
        })
        .catch((err) => {
            return res.status(404).json({
                error: err,
                message: "Error in retrieving Data from Database"
            });
        })
}

//Get event data
async function queryEventData(eventId, ownerId) {
    console.log("Event Id", eventId, "Owner Id", ownerId);
    let getuserDataParam = {
        TableName: 'EventDetails',
        FilterExpression: "eventId = :eventId AND ownerId = :ownerId",
        ExpressionAttributeValues: {
            ":eventId": eventId,
            ":ownerId": ownerId
        }
    };
    let response = await dbOperations.queryItemsinTable(getuserDataParam)
        .then((items) => {
            console.log(items);
            return items
        })
        .catch((error) => {
            return message = "User Not Found" + error.message;
        });
    console.log(response);
    return response;
}

async function updateEvent(req, res) {
    const { error, value } = validateEvent(req.body);

    if (error) {
        console.log(error);
        return res.send(error.details);
    }

    let updateDatedDetails = setUpdatedDetails(value);
    let updateEventParams = {
        TableName: "EventDetails",
        Key: {
            eventId: req.params.id,
            ownerId: req.body.ownerId
        },
        UpdateExpression: `set ${updateDatedDetails}`,
        ExpressionAttributeValues: setAttributeValues(value),
        ReturnValues: "ALL_NEW",
    }
    await dbOperations.updateAnItemInTable(updateEventParams)
        .then((items) => {
            console.log(items);
            return res.status(200).json();
        })
        .catch((err) => {
            console.log(err);
        })

}

function setUpdatedDetails(jsonObject) {
    let formattedStrings = [];
    console.log("Json Data", jsonObject);
    delete jsonObject.ownerId

    for (const [key] of Object.entries(jsonObject)) {
        formattedStrings.push(`${key} = :${key}`);
    }
    return formattedStrings.join(',');
}

function setAttributeValues(jsonObject) {
    delete jsonObject.ownerId
    console.log("Json Data", jsonObject);
    ExpressionAttribute = {};
    Object.entries(jsonObject).forEach(([key, value]) => { ExpressionAttribute[`:${key}`] = value })
    return ExpressionAttribute;
}

async function deleteEventParticularEvent(req, res, next) {
    let eventDeleteParams = {
        TableName: "EventDetails",
        Key: {
            eventId: req.params.id,
            ownerId: req.params.ownerid,
        }
    }

    let eventDetails = await queryEventData(eventDeleteParams.Key.eventId, eventDeleteParams.Key.ownerId)
    let appointmentAvaliable = await checkAppointmentAvaibility(req.params.id)
    console.log("Event details: ", eventDetails);
    if (eventDetails.length > 0) {
        if (appointmentAvaliable === 0) {
            await dbOperations.deleteAnItemInTable(eventDeleteParams)
                .then((items) => {
                    return res.status(200).json({

                        items: items.Items
                    }
                    )
                }).catch((error) => {
                    res.status(500).json({
                        message: error.message
                    })
                })
        }
        else {
            return res.status(412)
        }

    }
    else {
        return res.status(200).json({
        })
    }
}

//To check if the event has appointments booked before deletion
async function checkAppointmentAvaibility(eventId) {

    let bookedAppointment = {
        TableName: 'AppointmentsDetails',
        FilterExpression: `contains(attendeeId_eventId, :eventId) `,
        ProjectionExpression: 'appointmentId',
        ExpressionAttributeValues: {
            ":eventId": eventId
        }
    }

    await dbOperations.scanItemsinTable(bookedAppointment)
        .then((items) => {
            console.log("Appointment Availablity: " ,items);
            if (items.length > 0) {
                return items.length
            }
            else {
                return 0;
            }
        })
        .catch((err) => {
            return res.status(500).send(err.message);
        });
}



// Exporting mainly to the routes/eventRoute
module.exports = {
    getEvents: getEvents,
    getEventsOnOwner: getCurrentOwnerEvents,
    getAnEventData: getAnEventData,
    post: addNewEvent,
    bookaSlot: slotBooking,
    delete: deleteEventParticularEvent,
    updateEvent: updateEvent,
    getEventforMonth: scanAllEventsDateForMonth,
}