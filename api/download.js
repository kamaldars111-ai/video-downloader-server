
const axios = require('axios');

module.exports = async (req, res) => {
    // 1. ترويسات CORS المباشرة
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. معالجة طلب Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { videoUrl } = req.body || {};

    if (!videoUrl) {
        return res.status(400).json({ error: 'يرجى تقديم رابط صحيح' });
    }

    const cleanUrl = videoUrl.trim();

    // 3. محرك TikWM (TikTok)
    try {
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, { timeout: 8000 });
        if (response.data && response.data.code === 0 && response.data.data) {
            return res.status(200).json({
                downloadUrl: response.data.data.play || response.data.data.wmplay,
                title: response.data.data.title || 'فيديو TikTok',
                thumbnail: response.data.data.cover || ''
            });
        }
    } catch (e) {
        console.log("TikWM bypassed...");
    }

    // 4. محرك احتياطي Tiklydown
    try {
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`, { timeout: 8000 });
        if (response.data && (response.data.video || response.data.url)) {
            const finalLink = response.data.video?.noWatermark || response.data.video?.watermark || response.data.url;
            return res.status(200).json({
                downloadUrl: finalLink,
                title: response.data.title || 'فيديو جاهز للتحميل',
                thumbnail: response.data.cover || response.data.thumbnail || ''
            });
        }
    } catch (e) {
        console.log("Tiklydown bypassed...");
    }

    return res.status(400).json({ error: 'تعذر جلب الفيديو، تأكد من صحة الرابط.' });
};
