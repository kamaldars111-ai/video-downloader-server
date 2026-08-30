const axios = require('axios');

module.exports = async (req, res) => {
    // إعداد ترويسات CORS الشاملة
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // الاستجابة الفورية لطلبات المتصفح المبدئية (OPTIONS Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // قراءة البيانات بنجاح سواء كانت JSON أو String
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const videoUrl = body ? body.videoUrl : null;

        if (!videoUrl) {
            return res.status(400).json({ error: 'يرجى تقديم رابط صحيح' });
        }

        const cleanUrl = videoUrl.trim();

        // 1. محرك TikWM (TikTok)
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

        // 2. محرك احتياطي Tiklydown (جميع المنصات)
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

    } catch (err) {
        return res.status(500).json({ error: 'حدث خطأ في معالجة الطلب داخل السيرفر.' });
    }
};
