const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'يرجى تقديم رابط صحيح' });
    }

    try {
        // 1. التجميع والتنظيف للرابط
        const cleanUrl = videoUrl.trim();

        // 2. تجربة الاستخراج عبر خادم TikWM (ممتاز جداً لـ TikTok وبعض المنصات)
        const tikwmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
        const tikwmData = await tikwmRes.json();

        if (tikwmData.code === 0 && tikwmData.data) {
            return res.json({
                downloadUrl: tikwmData.data.play || tikwmData.data.wmplay,
                title: tikwmData.data.title || 'فيديو بدون عنوان',
                thumbnail: tikwmData.data.cover || ''
            });
        }

        // 3. المحرك البديل الشامل للمناصات الأخرى (YouTube, Instagram, Facebook)
        const fallbackRes = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`);
        const fallbackData = await fallbackRes.json();

        if (fallbackData && (fallbackData.video || fallbackData.url)) {
            const finalLink = fallbackData.video?.noWatermark || fallbackData.video?.watermark || fallbackData.url;
            return res.json({
                downloadUrl: finalLink,
                title: fallbackData.title || 'فيديو جاهز للتحميل',
                thumbnail: fallbackData.cover || fallbackData.thumbnail || ''
            });
        }

        return res.status(400).json({ error: 'تعذر استخراج رابط التنزيل. تأكد من صحة الرابط أو جرب رابطاً آخر.' });

    } catch (error) {
        console.error('Server Internal Error:', error);
        return res.status(500).json({ error: 'حدث خطأ في معالجة الطلب على السيرفر.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
