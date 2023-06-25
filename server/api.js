const express=require("express")
const mongo=require("mongodb").MongoClient
const router=express.Router()
const app=express()
const bodyparser=require("body-parser")
app.use(bodyparser.json({limit: '50mb'}))
app.use(bodyparser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))
const url="mongodb://127.0.0.1:27017/"
var d
var c
mongo.connect(url,(err,db)=>{
    if(err) throw err;
    console.log("Database created")
    var dbs=db.db("train")
    d=dbs

    // dbs.createCollection("data",(err)=>{
    //     if(err) throw err
    //     console.log("Collection created")
    //     db.close()
    // })


    
})

const axios = require('axios');


// Register your company with John Doe Railway Server
app.post('/train/register', async (req, res) => {
  try {
    // Implement registration logic here
    // Send the necessary registration details to John Doe Railway Server
    // Store the access code securely for future use
    const accessCode = 'nSFqRI'; // Replace with your actual access code
    res.json({ success: true, accessCode });
  } catch (error) {
    console.error('Error registering with John Doe Railway Server:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Middleware for authentication
const authenticate = (req, res, next) => {
  const accessCode = req.headers.authorization;
  // Verify the access token matches the stored access code
  if (accessCode !== 'nSFqRI') { // Replace with your stored access code
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

// GET endpoint for retrieving train schedules with seat availability and pricing
app.get('/trains', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Fetch train schedules from John Doe Railways API
    const schedulesResponse = await axios.get('http://104.211.219.98/train/trains/schedules');
    const schedules = schedulesResponse.data;

    // Filter trains departing in the next 30 minutes
    const filteredSchedules = schedules.filter(train => {
      const departureTime = new Date(train.departureTime);
      return departureTime > now && departureTime < twelveHoursFromNow;
    });

    // Fetch seat availability and pricing for each train
    const trainsWithAvailabilityAndPricing = await Promise.all(filteredSchedules.map(async train => {
      const availabilityResponse = await axios.get(`http://104.211.219.98:80/interview/trains/2344/availability/${train.trainId}`);
      const pricingResponse = await axios.get(`http://104.211.219.98:80/interview/trains/2344/pricing/${train.trainId}`);
      const availability = availabilityResponse.data;
      const pricing = pricingResponse.data;

      // Enhance the train data with availability and pricing
      return {
        ...train,
        availability,
        pricing,
      };
    }));

    // Calculate real-time values and sort the trains based on price, seat availability, and departure time
    const sortedTrains = trainsWithAvailabilityAndPricing.sort((a, b) => {
      const aPrice = a.pricing.price;
      const bPrice = b.pricing.price;
      const aSeats = a.availability.seats;
      const bSeats = b.availability.seats;
      const aDepartureTime = new Date(a.departureTime);
      const bDepartureTime = new Date(b.departureTime);

      if (aPrice !== bPrice) return aPrice - bPrice;
      if (aSeats !== bSeats) return bSeats - aSeats;
      return aDepartureTime - bDepartureTime;
    });

    res.json(sortedTrains);
  } catch (error) {
    console.error('Error fetching train schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch train schedules' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});





module.exports=router