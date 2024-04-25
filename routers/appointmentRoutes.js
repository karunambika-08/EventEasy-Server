const express = require('express');
const router = express.Router();

//Routes related to the appointments
const appoitmentsController = require('../controllers/appointmentsController');

router.post('/appointment', appoitmentsController.addAppointment); // add an appointment to the db

router.get('/attendee/:id/appointments/:type', appoitmentsController.getUserAppointments); // Request to fetch the appointments based on userId and type

router.get('/:id/appointments/:selectedDate',appoitmentsController.getAppointmentsforDate); // Request to fetch the appointments on selected date

router.get('appointments/event/:eventId/count?', appoitmentsController.getEventAppointments) // Request to fetch the appointments based on event Id

router.delete('/appointment/:id/:attendeeId_eventId', appoitmentsController.deleteAppointment) // Delete the selected appointment

module.exports = router;