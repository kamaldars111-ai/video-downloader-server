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

    // 1. المحرك الأول (TikTok + Shorts): TikWM
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
        console.log("Engine 1 (TikWM) bypassed...");
    }

    // 2. المحرك الثاني (YouTube / Instagram / FB): Cobalt Fast API
    try {
        const response = await axios.post('https://co.wuk.sh/api/json', {
            url: cleanUrl
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.data && (response.data.url || response.data.picker)) {
            const mediaUrl = response.data.url || (response.data.picker && response.data.picker[0]?.url);
            if (mediaUrl) {
                return res.json({
                    downloadUrl: mediaUrl,
                    title: 'فيديو جاهز التحميل',
                    thumbnail: response.data.picker && response.data.picker[0]?.thumb || ''
                });
            }
        }
    } catch (e) {
        console.log("Engine 2 (Cobalt) bypassed...");
    }

    // 3. المحرك الثالث الشامل الاحتياطي: SocialDownloader
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
        console.log("Engine 3 bypassed...");
    }

    // إذا فشلت جميع المحركات
    return res.status(400).json({ error: 'تعذر جلب الفيديو. تأكد من أن الرابط عام وصحيح (يوتيوب، تيك توك، أو إنستغرام).' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
