const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ⚙️ Config Options
const FILE_TO_SEND = 'inactive_4.csv'; 

// 🖼️ Banner Image Path (Canva theke image download kore ei path-e rakhben)
// Example: 'images/offer_banner.jpg' ba shudhu 'offer.jpg'
const IMAGE_RELATIVE_PATH = 'offer.jpg'; 

// 🔗 Catalog Link
const CATALOG_LINK = 'https://in.oriflame.com/products/digital-catalogue-current?store=IN-goldenstar'; 

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'oriflame-bot' }),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                if (data.name || data.Name || data.phone || data.Phone || data[0] || data[1]) {
                    results.push(data);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

client.on('ready', async () => {
    console.log('✅ WhatsApp Bot Ready!');
    
    const csvFilePath = path.join(__dirname, 'inactive_lists', FILE_TO_SEND);
    const imageFilePath = path.join(__dirname, IMAGE_RELATIVE_PATH);
    const failedLogPath = path.join(__dirname, 'failed_inactive_members.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ File paowa jayni: ${csvFilePath}`);
        return;
    }

    // Image ache kina check
    let media = null;
    if (fs.existsSync(imageFilePath)) {
        console.log(`🖼️ Image paowa geche: ${IMAGE_RELATIVE_PATH}`);
        media = MessageMedia.fromFilePath(imageFilePath);
    } else {
        console.log(`⚠️ Image paowa jayni (${IMAGE_RELATIVE_PATH}). Shudhu text message jabe.`);
    }

    try {
        console.log(`📂 Reading file: ${FILE_TO_SEND}...`);
        const customers = await readCSV(csvFilePath);
        console.log(`🎯 Total ${customers.length}-jon customer paowa geche.\n`);

        let successCount = 0;
        let failCount = 0;

        for (let customer of customers) {
            let rawName = customer.name || customer.Name || customer[0] || 'Valued Customer';
            let rawPhone = customer.phone || customer.Phone || customer[1] || '';

            const name = rawName.trim();
            let phone = rawPhone.toString().replace(/[^0-9]/g, '');

            // Skip header row if present
            if (phone.length < 10 && (phone.toLowerCase().includes('phone') || phone.toLowerCase().includes('mob'))) {
                console.log(`⚠️ Header row skipped: ${name}`);
                continue;
            }

            if (phone.length === 10) {
                phone = '91' + phone;
            }

            if (!phone || phone.length < 10) {
                console.log(`⚠️ Invalid phone number for: ${name}`);
                failCount++;
                fs.appendFileSync(failedLogPath, `${name},${phone},Invalid Number\n`, 'utf8');
                continue;
            }

            // 🪔 Campaign Message 🪔
            const campaignMessage = `Hi ${name},

Wishing you and your family a very Happy Festive Season! 🪔✨

We have a special festive offer just for you! Get a Flat ₹500 OFF on your order of ₹3000 or more. 🎉

📖 Explore our latest catalogue & offer details here:
${CATALOG_LINK}

To claim this offer or to place your order, simply reply to this message.

Best regards,
Arjo`;

            try {
                // WhatsApp Account Validation Check
                const numberDetails = await client.getNumberId(phone);

                if (numberDetails) {
                    if (media) {
                        // Image + Caption Soho Send
                        await client.sendMessage(numberDetails._serialized, media, { caption: campaignMessage });
                    } else {
                        // Shudhu Text Send
                        await client.sendMessage(numberDetails._serialized, campaignMessage);
                    }
                    console.log(`✅ Message sent to ${name} (${phone})`);
                    successCount++;
                } else {
                    console.log(`⚠️ Skipping ${name} (${phone}): Not registered on WhatsApp`);
                    failCount++;
                    fs.appendFileSync(failedLogPath, `${name},${phone},Not on WhatsApp\n`, 'utf8');
                }

                // Delay between messages (12 Seconds)
                await new Promise(resolve => setTimeout(resolve, 12000));

            } catch (err) {
                console.error(`❌ Failed to send to ${name} (${phone}):`, err.message);
                failCount++;
                fs.appendFileSync(failedLogPath, `${name},${phone},${err.message}\n`, 'utf8');
            }
        }

        console.log(`\n🎉 ${FILE_TO_SEND} file-er kaj complete!`);
        console.log(`📊 Success: ${successCount} | Failed: ${failCount}`);

        // Daily Report Save
        const reportContent = `Date: ${new Date().toLocaleString()}\nFile: ${FILE_TO_SEND}\nSuccess: ${successCount}\nFailed: ${failCount}\n-------------------\n`;
        fs.appendFileSync(path.join(__dirname, 'campaign_report.txt'), reportContent, 'utf8');
        console.log(`📝 Summary report saved to campaign_report.txt\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
});

client.initialize();