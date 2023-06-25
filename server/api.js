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



app.post('/train/register', async (req, res) => {
  try {
    const accessCode = 'nSFqRI'; 
    res.json({ success: true, accessCode });
  } catch (error) {
    console.error('Error registering with John Doe Railway Server:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});


const authenticate = (req, res, next) => {
  const accessCode = req.headers.authorization;

  if (accessCode !== 'nSFqRI') { 
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};


app.get('/trains', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  
    const schedulesResponse = await axios.get('http://104.211.219.98/train/trains/schedules');
    const schedules = schedulesResponse.data;

    
    const filteredSchedules = schedules.filter(train => {
      const departureTime = new Date(train.departureTime);
      return departureTime > now && departureTime < twelveHoursFromNow;
    });

    
    const trainsWithAvailabilityAndPricing = await Promise.all(filteredSchedules.map(async train => {
      const availabilityResponse = await axios.get(`http://104.211.219.98:80/interview/trains/2344/availability/${train.trainId}`);
      const pricingResponse = await axios.get(`http://104.211.219.98:80/interview/trains/2344/pricing/${train.trainId}`);
      const availability = availabilityResponse.data;
      const pricing = pricingResponse.data;

     
      return {
        ...train,
        availability,
        pricing,
      };
    }));

 
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
