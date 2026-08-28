const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'يرجى تقديم رابط صحيح' });
    }

    try {
        // التحقق من صحة الرابط
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'الرابط غير مدعوم أو غير صحيح' });
        }

        // جلب معلومات الفيديو
        const info = await ytdl.getInfo(videoUrl);
        
        // اختيار أفضل صيغة تحتوي على صوت وفيديو معا
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' }) 
                    || info.formats.find(f => f.hasVideo && f.hasAudio)
                    || info.formats[0];

        if (!format || !format.url) {
            return res.status(404).json({ error: 'لم يتم العثور على رابط مباشر لهذا الفيديو' });
        }

        return res.json({
            downloadUrl: format.url,
            title: info.videoDetails.title || 'فيديو بدون عنوان',
            thumbnail: info.videoDetails.thumbnails.pop()?.url || ''
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'تعذر جلب الفيديو، قد يكون محمي أو خاص' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
