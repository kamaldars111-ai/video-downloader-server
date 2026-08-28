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

    // 1. تجربة محرك Publer المباشر (يدعم YouTube, Instagram, TikTok, Facebook)
    try {
        const publerResponse = await axios.post('https://publer.io/api/v1/job_status/medias', {
            url: cleanUrl
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        if (publerResponse.data && publerResponse.data.payload) {
            const media = publerResponse.data.payload[0];
            const videoLink = media.path || (media.downloads && media.downloads[0]?.url);

            if (videoLink) {
                return res.json({
                    downloadUrl: videoLink,
                    title: media.caption || 'فيديو جاهز للتحميل',
                    thumbnail: media.thumbnail || ''
                });
            }
        }
    } catch (e) {
        console.log("Publer Engine bypassed...");
    }

    // 2. المحرك الاحتياطي: SSSTik / TikWM (خصيصاً لـ TikTok)
    try {
        const tikwm = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, { timeout: 8000 });
        if (tikwm.data && tikwm.data.code === 0 && tikwm.data.data) {
            return res.json({
                downloadUrl: tikwm.data.data.play || tikwm.data.data.wmplay,
                title: tikwm.data.data.title || 'فيديو تيك توك',
                thumbnail: tikwm.data.data.cover || ''
            });
        }
    } catch (e) {
        console.log("TikWM bypassed...");
    }

    // 3. المحرك الاحتياطي المباشر: SaveFrom Engine
    try {
        const savefrom = await axios.post('https://worker.sf-helper.com/project/sf-helper/api/savefrom.php', 
            `url=${encodeURIComponent(cleanUrl)}`, 
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000
            }
        );

        if (savefrom.data && savefrom.data.url && savefrom.data.url[0]) {
            return res.json({
                downloadUrl: savefrom.data.url[0].url,
                title: savefrom.data.meta?.title || 'فيديو جاهز للتحميل',
                thumbnail: savefrom.data.thumb || ''
            });
        }
    } catch (e) {
        console.log("SaveFrom bypassed...");
    }

    return res.status(400).json({ error: 'تعذر جلب الفيديو، يرجى التأكد من أن الرابط لبوست أو فيديو عام.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
