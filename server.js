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
        // الاتصال بمحرك التنزيل السريع لتجاوز حظر IPs
        const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: JSON.stringify({
                url: videoUrl,
                videoQuality: 'max'
            })
        });

        const data = await cobaltResponse.json();
        console.log("Cobalt Response:", data);

        if (data.status === 'stream' || data.status === 'redirect' || data.status === 'picker') {
            const finalUrl = data.url || (data.picker && data.picker[0] ? data.picker[0].url : null);

            if (finalUrl) {
                return res.json({
                    downloadUrl: finalUrl,
                    title: 'فيديو جاهز للتحميل',
                    thumbnail: data.picker && data.picker[0] ? data.picker[0].thumb : ''
                });
            }
        }

        return res.status(400).json({ error: 'تعذر استخراج الفيديو. تأكد من أن الرابط عام وليس لحساب خاص.' });

    } catch (error) {
        console.error('Server Fetch Error:', error);
        return res.status(500).json({ error: 'حدث خطأ في الاتصال بسيرفر التنزيل.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
