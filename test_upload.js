const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        const filePath = path.join(__dirname, 'assets/img/avatar/penguin.png');
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        const imageBuffer = fs.readFileSync(filePath);
        const form = new FormData();
        form.append('image', imageBuffer, {
            filename: 'penguin.png'
        });

        const authToken = 'AuroraTest_' + Math.random().toString(36).substr(2, 9);
        
        console.log('Uploading...');
        const response = await axios.post('https://i.111666.best/image', form, {
            headers: {
                ...form.getHeaders(),
                'Auth-Token': authToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('Success:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testUpload();