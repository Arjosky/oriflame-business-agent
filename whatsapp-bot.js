const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ⚙️ ফাইল নেম (প্রয়োজন অনুযায়ী পরিবর্তন করবেন)
const FILE_TO_SEND = 'inactive_8.csv'; 

// 🔗 ক্যাটালগ লিংক
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
            .pipe(csv()) // এখানে হেডার অটো ডিটেক্ট করবে (যেমন: name, phone)
            .on('data', (data) => {
                // হেডার রো বা ফাঁকা ডেটা ফিল্টার করার জন্য চেক
                if (data.name || data.Name || data.phone || data.Phone) {
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

    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ File পাওয়া যায়নি: ${csvFilePath}`);
        return;
    }

    try {
        console.log(`📂 Reading file: ${FILE_TO_SEND}...`);
        const customers = await readCSV(csvFilePath);
        console.log(`🎯 মোট ${customers.length}-জন কাস্টমার পাওয়া গেছে।\n`);

        for (let customer of customers) {
            let rawName = customer.name || customer.Name || customer[0] || 'Valued Customer';
            let rawPhone = customer.phone || customer.Phone || customer[1] || '';

            const name = rawName.trim();
            let phone = rawPhone.toString().replace(/[^0-9]/g, '');

            // যদি প্রথম রো-তে হেডার নিজেই চলে আসে, তা স্কিপ করার জন্য চেক
            if (phone.length < 10 && (phone.toLowerCase().includes('phone') || phone.toLowerCase().includes('mob'))) {
                console.log(`⚠️ Header row skipped: ${name}`);
                continue;
            }

            if (phone.length === 10) {
                phone = '91' + phone;
            }

            if (!phone || phone.length < 10) {
                console.log(`⚠️ Invalid phone number for: ${name}`);
                continue;
            }

            // 🪔 Campaign Message 🪔
            const campaignMessage = `Hi ${name},

Wishing you and your family a very Happy Dussehra! 🪔✨

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
                    await client.sendMessage(numberDetails._serialized, campaignMessage);
                    console.log(`✅ Message sent to ${name} (${phone})`);
                } else {
                    console.log(`⚠️ Skipping ${name} (${phone}): Not registered on WhatsApp`);
                }

                // অ্যাকাউন্ট নিরাপত্তার জন্য ১২ সেকেন্ডের গ্যাপ
                await new Promise(resolve => setTimeout(resolve, 12000));

            } catch (err) {
                console.error(`❌ Failed to send to ${name} (${phone}):`, err.message);
            }
        }

        console.log(`\n🎉 ${FILE_TO_SEND} ফাইলের কাজ সফলভাবে সম্পন্ন হয়েছে!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
});

client.initialize();