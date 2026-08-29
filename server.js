const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// تفعيل CORS
app.use(cors());

// معالجة طلبات Preflight فورياً
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

app.use(express.json());

app.post('/api/download', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'يرجى تقديم رابط صحيح' });
    }

    const cleanUrl = videoUrl.trim();

    // TikWM (TikTok)
    try {
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, { timeout: 8000 });
        if (response.data && response.data.code === 0 && response.data.data) {
            return res.json({
                downloadUrl: response.data.data.play || response.data.data.wmplay,
                title: response.data.data.title || 'فيديو TikTok',
                thumbnail: response.data.data.cover || ''
            });
        }
    } catch (e) {
        console.log("TikWM bypassed...");
    }

    // Tiklydown (YouTube/IG/TikTok)
    try {
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`, { timeout: 8000 });
        if (response.data && (response.data.video || response.data.url)) {
            const finalLink = response.data.video?.noWatermark || response.data.video?.watermark || response.data.url;
            return res.json({
                downloadUrl: finalLink,
                title: response.data.title || 'فيديو جاهز للتحميل',
                thumbnail: response.data.cover || response.data.thumbnail || ''
            });
        }
    } catch (e) {
        console.log("Tiklydown bypassed...");
    }

    return res.status(400).json({ error: 'تعذر جلب الفيديو، تأكد من صحة الرابط.' });
});

module.exports = app;
