const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DP_USER}:${process.env.DP_PASSWORD}@cluster0.qez1k8e.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const appointmentOptionCollection = client.db("doctorsPortal").collection("appointmentOptions");
    const bookingsCollection = client.db("doctorsPortal").collection("bookings");

    app.get("/appointmentoptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentOptionCollection.find(query).toArray();

// get the booking of the provided date
      const bookingQuery = {appointmentDate: date};
      const alreadyBooked  = await bookingsCollection.find(bookingQuery).toArray();

       options.forEach(option =>{
        const optionBooked = alreadyBooked.filter(book => book.treatment === option.name );
        const bookedSlots = optionBooked.map( book => book.slot);
        const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
        option.slots = remainingSlots;
        // console.log(date, option.name, remainingSlots.length);
       })
      res.send(options);
    });

    // Bookings
    app.post('/bookings', async(req, res)=>{
      const bookings = req.body;
      const query = {
        appointmentDate: bookings.appointmentDate,
        email: bookings.email,
        treatment: bookings.treatment
      }

      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if(alreadyBooked.length){
        const message = `You already have a booking ${bookings.appointmentDate}`;
        return res.send({acknowledged: false, message});
      }

      const result = await bookingsCollection.insertOne(bookings);
      res.send(result);
    })

    app.get('/bookings', async(req, res)=>{
      const query = {};
      const cursor = bookingsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })


  } finally {
  }
}
run().catch(console.log);

app.get("/", (req, res) => {
  res.send("Doctors Portal Working Properly...");
});
app.listen(port, () => {
  console.log("Doctors Portal:", port);
});
