require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { format, subDays } = require('date-fns');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

const makeNASARequest = async (url, params = {}) => {
  try {
    const response = await axios.get(url, {
      params: { ...params, api_key: NASA_API_KEY },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('NASA API Error:', error.message);
    if (error.response) {
      throw new Error(error.response.data.msg || 'NASA API Error');
    }
    throw new Error(error.message);
  }
};

// APOD endpoint
app.get('/api/apod', async (req, res) => {
  try {
    const { date } = req.query;
    const data = await makeNASARequest(
      'https://api.nasa.gov/planetary/apod',
      { date }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mars Rover Photos endpoint
app.get('/api/mars-photos', async (req, res) => {
  try {
    let { earth_date, camera, page } = req.query;
    earth_date = earth_date || format(subDays(new Date(), 1), 'yyyy-MM-dd');
    page = page || 1;

    const data = await makeNASARequest(
      'https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos',
      { earth_date, camera, page }
    );

    if (!data.photos || data.photos.length === 0) {
      return res.status(404).json({
        error: 'No photos found',
        message: `No Mars photos available for ${earth_date}${camera ? ` with camera ${camera}` : ''}`,
        suggestions: [
          'Try a different date',
          'Try a different camera',
          'Check if the date is within the rover mission duration'
        ]
      });
    }

    res.json({
      photos: data.photos,
      hasMore: data.photos.length >= 25,
      earth_date,
      camera
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEO endpoint
app.get('/api/neo', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const data = await makeNASARequest(
      'https://api.nasa.gov/neo/rest/v1/feed',
      { start_date, end_date }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});