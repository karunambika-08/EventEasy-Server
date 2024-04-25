const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventsController');

//Routes related to the events
router.post('/event', eventController.post) // Add a new Event to the database 

router.get('/eventsOwner/:id/events/:type', eventController.getEventsOnOwner) // Get events based on owner and type of event

router.get('/event/:id', eventController.getAnEventData) // Get a specific event based on event ID

router.get('/events', eventController.getEvents) // Get all events in the table

router.get('/event/appointments/:id/:selectedDate', eventController.bookaSlot) //Get slots for the selected event and selected date

router.get('/events/month/:monthYear/:eventId?', eventController.getEventforMonth) //Get all event for the particular month view

router.put('/event/:id', eventController.updateEvent); // Update the event

router.delete('/event/:id/:ownerid',eventController.delete); // Delete the event


module.exports = router