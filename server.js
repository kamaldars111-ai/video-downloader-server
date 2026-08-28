const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/download', (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'يرجى تقديم رابط صحيح' });
    }

    // أمر yt-dlp لجلب رابط التنزيل المباشر
    const command = `npx yt-dlp-exec "${videoUrl}" --dump-single-json`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Exec error:', error);
            return res.status(500).json({ error: 'فشل في جلب الفيديو' });
        }

        try {
            const data = JSON.parse(stdout);
            const downloadUrl = data.url || (data.formats && data.formats[0]?.url);
            return res.json({ downloadUrl, title: data.title, thumbnail: data.thumbnail });
        } catch (e) {
            return res.status(500).json({ error: 'خطأ في معالجة البيانات' });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
