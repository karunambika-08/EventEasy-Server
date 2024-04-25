

const Joi = require('joi');
const validator = (schema)=> (payload) => 
schema.validate(payload, {abortEarly: false});

const signupSchema = Joi.object({
    userName: Joi.string().max(25).required(),
    email : Joi.string().email().required(),
    password : Joi.string()
    .min(8) 
    .max(30) 
    .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};:\'"|,.<>/?]*$')) // Allow letters (upper and lower case), numbers, and special characters
    .required(),
    type : Joi.string().valid('eventsOwner', 'attendee'),
})

const signinSchema = Joi.object({
    email : Joi.string().email().required(),
    password : Joi.string().required(),
})

const appointmentSchema = Joi.object({
    eventId : Joi.string().required(),
    eventName : Joi.string().required(),
    attendeeId : Joi.string().required(),
    attendeeName : Joi.string().required(),
    attendeeMail : Joi.string().email().required(),
    appointmentDate : Joi.number().required(),
    appointmentStartTime :Joi.number().required(),
    appointmentEndTime : Joi.number().required(),
    
})

const eventSchema = Joi.object({
    ownerId: Joi.string().required(),
    eventName: Joi.string().min(5).max(30).required(),
    eventMail: Joi.string().email().required(),
    startDate: Joi.number().required(),
    endDate: Joi.number().required(),
    appointmentDuration: Joi.string().required(),
    eventDays: Joi.array().items(Joi.object({
        eventDay: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
        startTime: Joi.number().required(),
        endTime: Joi.number().required(),
        intervalEnabled: Joi.boolean().required(),
        intervalStartTime: Joi.when('intervalEnabled', {
            is: true,
            then:Joi.number().required(),
            otherwise: Joi.optional()
        }),
        intervalEndTime: Joi.when('intervalEnabled', {
            is: true,
            then: Joi.number().required(),
            otherwise: Joi.optional()
        })
    })).required()
});



module.exports ={
    validateSignup : validator(signupSchema),
    validateSignin : validator(signinSchema),
    validateAppointment : validator(appointmentSchema),
    validateEvent : validator(eventSchema)
};