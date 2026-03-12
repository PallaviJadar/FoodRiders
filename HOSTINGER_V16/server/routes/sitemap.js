const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

router.get('/sitemap.xml', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({}, 'name updatedAt slug').lean();

        const baseUrl = 'https://www.foodriders.in'; // Replace with actual domain in production

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/show-case</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;

        restaurants.forEach(rest => {
            const slug = rest.slug || rest.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            xml += `
    <url>
        <loc>${baseUrl}/restaurant/${slug}</loc>
        <lastmod>${rest.updatedAt ? new Date(rest.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
        });

        xml += `
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);

    } catch (err) {
        console.error("Sitemap generation error:", err);
        res.status(500).end();
    }
});

module.exports = router;
