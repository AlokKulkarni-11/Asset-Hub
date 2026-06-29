const jwt = require('jsonwebtoken');
const axios = require('axios');

const secret = Buffer.from('ZGVmYXVsdFNlY3JldEtleVRoYXRJc0F0TGVhc3QyNTZCaXRzTG9uZzEyMzQ1Njc4OTA=', 'base64');
const token = jwt.sign({ sub: 'alokgdsc@gmail.com' }, secret, { expiresIn: '1h' });

async function check() {
    try {
        console.log("Token: " + token);
        const res = await axios.get('http://localhost:8080/api/assets', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Status: " + res.status);
        console.log("Data: " + JSON.stringify(res.data, null, 2));
    } catch (e) {
        if (e.response) {
            console.log("Error Status: " + e.response.status);
            console.log("Error Data: " + JSON.stringify(e.response.data, null, 2));
        } else {
            console.log("Error: " + e.message);
        }
    }
}
check();
