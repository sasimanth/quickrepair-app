const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const run = async () => {
  try {
    const secret = process.env.JWT_SECRET || 'secret';
    console.log('JWT_SECRET used:', secret);

    // Test user Shashank
    const userPayload = {
      id: '6a23cd74165c7159c79119ae',
      role: 'user',
      email: 'gsasimanthreddy+u1@gmail.com'
    };
    const userToken = jwt.sign(userPayload, secret, { expiresIn: '30d' });
    console.log('Sending GET request as USER Shashank to production...');
    await makeRequest(userToken);

    // Test technician Sasi
    const techPayload = {
      id: '6a23cda3165c7159c79119f3',
      role: 'technician',
      email: 'gsasimanthreddy+t1@gmail.com'
    };
    const techToken = jwt.sign(techPayload, secret, { expiresIn: '30d' });
    console.log('Sending GET request as TECHNICIAN Sasi to production...');
    await makeRequest(techToken);
  } catch (error) {
    console.error('Script Error:', error);
  }
};

async function makeRequest(token) {
  const url = 'https://fixvo-backend.onrender.com/api/bookings';
  try {
    const headers = {};
    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.get(url, { headers });
    console.log('Production Response Status:', response.status);
    console.log('Production Response Data:', response.data);
  } catch (err) {
    console.error('Production Request Failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error('Error message:', err.message);
    }
  }
}

run();
