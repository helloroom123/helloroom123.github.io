const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCatbox() {
    try {
        const filePath = path.join(__dirname, 'assets/img/avatar/penguin.png');
        if (!fs.existsSync(filePath)) {
            console.error('File not found');
            return;
        }

        const imageBuffer = fs.readFileSync(filePath);
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', imageBuffer, 'penguin.png');

        console.log('Uploading to Catbox...');
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0'
            }
        });

        console.log('Success:', response.status);
        console.log('URL:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCatbox();