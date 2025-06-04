require('dotenv').config();
const express = require('express');
const axios = require('axios');
const xmlbuilder = require('xmlbuilder');
const cheerio = require('cheerio');

const app = express();
app.use(express.json());

// Middleware: log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Constants
const XML_OPTS = { voice: 'Polly.Andres-Neural', language: 'es-MX' };

// Validate required env var
if (!process.env.TWILIO_WEBHOOK_URL) {
    console.warn('Warning: TWILIO_WEBHOOK_URL is not set in the environment variables.');
}

let latestXml = null;

// Parse and format a Spanish date string into a spoken-friendly version
function formatDateString(rawDate) {
    const regex = /(\d{2})\/(\d{2})\/(\d{2}) (\d{2}:\d{2}) (AM|PM)/;
    const match = rawDate.match(regex);

    if (!match) throw new Error('Unrecognized date format');

    let [_, day, month, year, time, period] = match;
    year = `20${year}`;
    let [hour, minute] = time.split(':');
    if (period === 'PM' && hour !== '12') hour = parseInt(hour, 10) + 12;
    else if (period === 'AM' && hour === '12') hour = '00';

    hour = hour.toString().padStart(2, '0');

    const isoString = `${year}-${month}-${day}T${hour}:${minute}:00-03:00`;
    return new Date(isoString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        timeZone: 'America/Argentina/Buenos_Aires',
    });
}

// Fetch exchange rate from dolarhoy.com and build the XML response
async function fetchExchangeRate() {
    try {
        const { data: html } = await axios.get('https://dolarhoy.com/');
        const $ = cheerio.load(html);
        const buy = $('.tile.is-child .compra .val').first().text().trim().replace('$', '');
        const sell = $('.tile.is-child .venta .val').first().text().trim().replace('$', '');
        const rawDate = $('.tile.is-child .update span').first().text().trim().replace('Actualizado por última vez: ', '');

        if (!rawDate) throw new Error('Date not found');

        const formattedDate = formatDateString(rawDate);

        const xml = xmlbuilder.create('Response')
            .ele('Say', XML_OPTS, `${buy} pesos to buy. ${sell} pesos to sell. Last update: ${formattedDate}.`)
            .up()
            .ele('Redirect', { method: 'POST' }, `${process.env.TWILIO_WEBHOOK_URL}?FlowEvent=return`)
            .end({ pretty: true });

        latestXml = xml;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);

        latestXml = xmlbuilder.create('Response')
            .ele('Say', XML_OPTS, 'Sorry, we could not retrieve the current exchange rate. Please try again later.')
            .up()
            .ele('Redirect', { method: 'POST' }, `${process.env.TWILIO_WEBHOOK_URL}?FlowEvent=return`)
            .end({ pretty: true });
    }
}

// POST endpoint to trigger update
app.post('/update', async (req, res) => {
    await fetchExchangeRate();
    res.status(200).send({ message: 'Update completed.' });
});

// GET endpoint to serve latest XML
app.get('/dollar-blue', (req, res) => {
    if (latestXml) {
        res.type('application/xml').send(latestXml);
    } else {
        const fallback = xmlbuilder.create('Response')
            .ele('Say', XML_OPTS, 'Sorry, we could not retrieve the current exchange rate. Please try again later.')
            .up()
            .ele('Redirect', { method: 'POST' }, `${process.env.TWILIO_WEBHOOK_URL}?FlowEvent=return`)
            .end({ pretty: true });

        res.type('application/xml').send(fallback);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await fetchExchangeRate();
});