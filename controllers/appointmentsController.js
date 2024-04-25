const express = require('express');
const dbOperations = require('../database/dbOperations');
const { v4: uuid } = require('uuid')
const moment = require('moment'); 
const { validateAppointment } = require('../util/validation');

/**
 * 
 * @param {*} req Appointments Details
 * @param {*} res Status code of Adding appointments details to the database
 * @returns Status code of Adding appointments details to the database
 */
async function addNewAppointment( req, res){
    try{
    const {error } = validateAppointment(req.body)
    if(error){
        console.log(error.message);
        return res.send(error.details);
    }
        let appointmentDataParams = {
            TableName : 'AppointmentsDetails',
            Item : appendAppointmentId(),
        }
        let dbresponse = dbOperations.addItemInTable('AppointmentsDetails',appointmentDataParams);
        dbresponse.then(()=>{
            res.status(200).json({})
        })
        .catch((error) => {
            return res.status(400).send(error.message)
        })
    }
    catch(error){
        return ('Error in Adding Event:',error.message);
    }
    function  appendAppointmentId(){
        let appointmentId = uuid();
        let appointmentData = req.body;
        appointmentData.appointmentId = appointmentId;
        appointmentData.createdAt = moment().valueOf();
        appointmentData.updatedAt = moment().valueOf();
        appointmentData.attendeeId_eventId = `${appointmentData.attendeeId}${appointmentData.eventId}${appointmentId}`;
        return appointmentData;
    }
}

//Function to get appointments based on user and time of appointment
async function getCurrentUserAppointment(req,res,next){
   let currentDate = moment().valueOf();

   let endDateQuery;
   if(req.params.type === "booked"){
     endDateQuery = "#appointmentDate >= :currentDate";
   }
   else if(req.params.type === "completed"){
    endDateQuery = "#appointmentDate <= :currentDate";
   }
  

   let bookedAppointment = {
        TableName : 'AppointmentsDetails',
        FilterExpression : `contains(attendeeId_eventId, :attendeeId)  AND ${endDateQuery}`,
        ProjectionExpression : 'attendeeName,eventId,attendeeMail,appointmentStartTime,appointmentId,eventName,attendeeId,appointmentEndTime,appointmentDate,attendeeId_eventId',
        ExpressionAttributeNames: { "#appointmentDate": "appointmentDate" },
        ExpressionAttributeValues: {
            ":attendeeId": req.params.id,
            ":currentDate": currentDate
        }
   }

   await dbOperations.scanItemsinTable(bookedAppointment)
   .then((items)=>{
     if(items.length>0){
        res.cookie('bookedAppointment',items.length)
        return res.status(200).json(items)
     }
     else {
        return res.status(200).json([])
    }
   })
   .catch((err) => {
    return res.status(500).send(err.message);
});
console.log("Headers",req.headers.cookie);
console.log("Cookies",req.cookies);

}

//Function to get appointments based on event

async function  getAppointmentsforEvent(req,res,next){
    const {count} = req.params;
    let bookedAppointment = {
        TableName : 'AppointmentsDetails',
        FilterExpression : `contains(attendeeId_eventId, :eventId) `,
        ProjectionExpression : 'attendeeName,eventId,attendeeMail,appointmentStartTime,appointmentId,eventName,attendeeId,appointmentEndTime,appointmentDate,attendeeId_eventId',
        ExpressionAttributeValues: {
            ":eventId": req.params.eventId
        }
   }

   await dbOperations.scanItemsinTable(bookedAppointment)
   .then((items)=>{
     if(items.length>0){
        if(count){
            return res.status(200).json(items.length)
        }
        else{
            return res.status(200).json(items)
        }
        
     }
     else {
        return res.json([])
    }
   })
   .catch((err) => {
    return res.status(500).send(err.message);
});
}


// Function to delete a appointment
async function deleteAppointment(req, res, next) {
    console.log(req.params.id);
    let appointmentDeleteParams = {
        TableName: "AppointmentsDetails",
        Key: {
            appointmentId: req.params.id,
            attendeeId_eventId : req.params.attendeeId_eventId
        }
    }
    try {
        const items = await dbOperations.deleteAnItemInTable(appointmentDeleteParams);
        console.log("Items",items);
        return res.status(200).json({
        });
    } catch (err) {
        console.error(err); 
        return res.status(404).json({
        });
    }
}
//Function to get appointments on selected date based on user/event  
async function getAppointmentsforDate(req, res, next) {
    console.log(req.params.id, req.params.selectedDate);
    let bookedAppointment = {
        TableName : 'AppointmentsDetails',
        FilterExpression : `(contains(attendeeId_eventId, :id) OR contains(attendeeId_eventId, :id)) AND  appointmentDate = :date`, 
        ProjectExpression : 'attendeeName,eventId,attendeeMail,appointmentStartTime,appointmentId,eventName,attendeeId,appointmentEndTime,appointmentDate, attendeeId_eventId',
        ExpressionAttributeValues: {
            ":id": req.params.id,
            ":date" : moment(req.params.selectedDate).valueOf(),
        }
   }
   await dbOperations.scanItemsinTable(bookedAppointment)
   .then((items)=>{
     if(items.length>0){
        return res.status(200).json(items)
     }
     else {
        return res.json({})
    }
   })
   .catch((err) => {
    console.log(err)
    return res.status(500).send(err.message);
});
}

module.exports = {
    addAppointment : addNewAppointment,
    getUserAppointments : getCurrentUserAppointment,
    getEventAppointments : getAppointmentsforEvent,
    deleteAppointment : deleteAppointment,
    getAppointmentsforDate : getAppointmentsforDate
}