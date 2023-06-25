const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


mongoose.connect('mongodb://127.0.0.1/number_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;


const numberSchema = new mongoose.Schema({
  numbers: [Number],
});
const NumberModel = mongoose.model('Number', numberSchema);

const numbersToSave = [1, 2, 3, 5, 8, 13];


const number = new NumberModel({ numbers: numbersToSave });

(async () => {
  try {
    const savedNumber = await number.save();
    console.log('Numbers saved to the database:', savedNumber);
  } catch (err) {
    console.error(err);
  }
})();

app.get('/numbers', async (req, res) => {
  try {
    // Find all number documents
    const numbers = await NumberModel.find({});
    res.status(200).json(numbers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve numbers' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
