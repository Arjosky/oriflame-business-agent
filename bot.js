const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('🤖 Oriflame Auto-Reply Bot is ready!');
});

client.on('message', async msg => {
    if (msg.body.toLowerCase().includes('details') || msg.body.toLowerCase().includes('interested')) {
        msg.reply('✨ Thank you for your interest! Here is our digital catalogue: https://in.oriflame.com/products/digital-catalogue-current?store=IN-goldenstar');
    }
});

client.initialize();