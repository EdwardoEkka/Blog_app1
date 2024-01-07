const express = require('express');
const { connectToDb, getDb } = require('./db');
const cors = require('cors'); // Import cors
const { ObjectId } = require('mongodb');


const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Enable CORS for all routes
app.use(cors());

let db;

connectToDb((err) => {
  if (err) {
    console.error('Error occurred while connecting to the database:', err);
    return;
  }
  console.log('Connected successfully to the database');

  app.listen(5000, () => {
    console.log('App listening on port 5000');
  });

  db = getDb();
});

app.post('/signup', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).send('Database not connected');
    }

    const userDetails = req.body; // Assuming request body contains the user details
    console.log('Received user details:', userDetails);

    // Validate the received user details, ensuring required fields are present
    if (!userDetails.username || !userDetails.password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if the username already exists in the collection
    const existingUser = await db.collection('users').findOne({ username: userDetails.username });
    if (existingUser) {
      return res.status(201).json({ message: 'exists' });
    }

    const result = await db.collection('users').insertOne(userDetails);
    await db.createCollection(userDetails.username);
    if (result.acknowledged) {
      return res.status(201).json({ message: 'User details added successfully' });
    } else {
      throw new Error('Failed to add user details');
    }
  } catch (err) {
    console.error('Error adding user details:', err);
    res.status(500).send('Could not add the user details');
  }
});


app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find the user by username
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      return res.status(201).json({ message: 'Invalid' });
    }
    // Compare passwords
    if (password === user.password) {
      res.status(200).json({ message: 'Valid' });
    } else {
      res.status(200).json({ message: 'Invalid' });
    }
  }catch (err) {
    console.error('Error signing in:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assuming your existing setup with Express and other necessary imports

app.get('/view', async (req, res) => {
  const { username } = req.query; // Get the username from the request query

  try {
    // Assuming 'db' is your MongoDB client and 'data' is the collection name
    const collection = db.collection(username);

    // Fetch data from the specified collection
    const userData = await collection.find({}).toArray();

    // Send the data as a response
    res.status(200).json(userData);
  } catch (error) {
    // Handle errors
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Assuming you have necessary imports and setup for Express and MongoDB

// Sample route handling the blog creation
app.post('/createblog', async (req, res) => {
  const { title, content, username } = req.body;

  
  try {

      // Use the username as the collection name
      const collection = db.collection(username);
    console.log(username);
    // Insert the combined data as JSON into the collection
    const result = await collection.insertOne({ title, content });
      if (result.acknowledged) {
          res.status(201).json({ message: 'Blog created successfully' });
      } else {
          res.status(500).json({ message: 'Failed to create blog' });
      }
  } catch (error) {
      console.error('Error creating blog:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

// Delete method route
app.delete('/delete', async (req, res) => {
  const { id, username } = req.body;

  console.log(req.body); // Log the received ID

  try {
    const objectId = new ObjectId(id);
    const result = await db.collection(username).deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Entry not found or already deleted' });
    }

    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'An error occurred while deleting the entry' });
  }
});

app.post('/fetchData', async (req, res) => {
  const { username,objectId } = req.body; 
  console.log(objectId);
  try {
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collection = db.collection(username);
    const oId = new ObjectId(objectId);
    const userData = await collection.findOne({ _id: oId });
    console.log(userData);

    if (!userData) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/updateData', async (req, res) => {
  const username=req.body.username;
  const id=req.body._id;
  const title=req.body.title;
  const content=req.body.content;
  try {
    const data = await db.collection(username).findOne({ _id: new ObjectId(id) });
    
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the donor
    const updatedData = await db.collection(username).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { title, content } },
      { returnOriginal: false }
    );

    res.json({ message: 'Updated successfully', data: updatedData.value });
  } catch (error) {
    res.status(500).json({ message: 'Error updating donor', error: error.message });
  }
});


module.exports = app;