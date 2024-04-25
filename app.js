//Main File
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {rateLimit } = require('express-rate-limit');



app.use(express.json({extended:true}))
app.use(cookieParser());
app.use(cors({
    origin :"*",
    optionsSuccessStatus: 200,
}))

const dotenv = require('dotenv').config();;

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	limit: 1000,
	standardHeaders: 'draft-7', 
	legacyHeaders: false, 
    message : "Too many requests from this IP , please try again later."
})

app.use(limiter)

const userRoutes = require('./routers/index')
const eventRoutes = require('./routers/eventRoute')
const appointmentRoutes = require('./routers/appointmentRoutes');

app.use(
    userRoutes,  // import routes from routers/index file
    eventRoutes,  // import routes from eventRoute file
    appointmentRoutes //import routes from appointmentRoute file
)


//Server
app.listen(process.env.PORT, ()=>console.log(`Server is running in the port ${process.env.PORT}  ....`))