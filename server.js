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

    // المصدر الأول: TikWM (لتيك توك)
    try {
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, { timeout: 10000 });
        if (response.data && response.data.code === 0 && response.data.data) {
            return res.json({
                downloadUrl: response.data.data.play || response.data.data.wmplay,
                title: response.data.data.title || 'فيديو بدون عنوان',
                thumbnail: response.data.data.cover || ''
            });
        }
    } catch (e) {
        console.log("TikWM Failed, trying secondary source...");
    }

    // المصدر الثاني الاحتياطي: Tiklydown
    try {
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`, { timeout: 10000 });
        if (response.data && (response.data.video || response.data.url)) {
            const finalLink = response.data.video?.noWatermark || response.data.video?.watermark || response.data.url;
            return res.json({
                downloadUrl: finalLink,
                title: response.data.title || 'فيديو جاهز للتحميل',
                thumbnail: response.data.cover || response.data.thumbnail || ''
            });
        }
    } catch (e) {
        console.log("Secondary source failed.");
    }

    // إذا فشلت المصادر
    return res.status(400).json({ error: 'تعذر استخراج الفيديو. التأكد من أن حساب الفيديو عام وليس خاصاً.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
