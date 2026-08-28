const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'يرجى تقديم رابط صحيح' });
    }

    const cleanUrl = videoUrl.trim();

    // 1. المحرك الأول: TikWM (لتيك توك)
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

    // 2. المحرك الثاني: Cobalt API
    try {
        const cobaltRes = await axios.post('https://api.cobalt.tools/api/json', {
            url: cleanUrl
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (cobaltRes.data) {
            const data = cobaltRes.data;
            let downloadLink = data.url || (data.picker && data.picker[0]?.url);

            if (downloadLink) {
                return res.json({
                    downloadUrl: downloadLink,
                    title: 'فيديو جاهز للتحميل',
                    thumbnail: data.picker && data.picker[0]?.thumb || ''
                });
            }
        }
    } catch (e) {
        console.log("Cobalt bypassed...");
    }

    // 3. المحرك الثالث: Tiklydown
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

// تصدير التطبيق ليعمل مع Vercel Serverless
module.exports = app;
