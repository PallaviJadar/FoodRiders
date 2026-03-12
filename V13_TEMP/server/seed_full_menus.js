const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('./models/Restaurant');

dotenv.config({ path: path.join(__dirname, '.env') });

// --- HELPER FUNCTIONS ---

function normalize(s) {
    if (!s) return "";
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function extractVariable(fileContent, varName) {
    try {
        // Strip comments
        const cleanContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
        const startPattern = `const ${varName} = `;
        const startIndex = cleanContent.indexOf(startPattern);

        if (startIndex === -1) return null;

        let currentPos = startIndex + startPattern.length;
        while (currentPos < cleanContent.length && /\s/.test(cleanContent[currentPos])) currentPos++;

        let openChar = cleanContent[currentPos] === '{' ? '{' : (cleanContent[currentPos] === '[' ? '[' : null);
        if (!openChar) return null;
        let closeChar = openChar === '{' ? '}' : ']';

        let depth = 0;
        let inString = false;
        let stringChar = '';
        let startJsonIndex = currentPos;

        for (let i = currentPos; i < cleanContent.length; i++) {
            const char = cleanContent[i];
            if (inString) {
                if (char === stringChar && cleanContent[i - 1] !== '\\') inString = false;
            } else {
                if (char === '"' || char === "'" || char === '`') {
                    inString = true;
                    stringChar = char;
                } else if (char === openChar) {
                    depth++;
                } else if (char === closeChar) {
                    depth--;
                    if (depth === 0) {
                        const extracted = cleanContent.substring(startJsonIndex, i + 1);
                        return new Function(`return ${extracted}`)();
                    }
                }
            }
        }
    } catch (e) {
        console.error(`Error extracting ${varName}:`, e.message);
    }
    return null;
}

function getManifest() {
    console.log("Reading Manifest...");
    try {
        const manifestPath = path.join(__dirname, '../src/utils/imageManifest.js');
        if (fs.existsSync(manifestPath)) {
            const content = fs.readFileSync(manifestPath, 'utf8');
            const match = content.match(/export const imageManifest = ({[\s\S]*?});/);
            if (match) {
                const cleanJson = match[1].replace(/\/\/.*/g, '');
                return new Function(`return ${cleanJson}`)();
            }
        }
    } catch (e) { console.error("Manifest Parse Error:", e.stack); }
    return {};
}

function getCsvData(csvPath) {
    console.log(`Reading CSV: ${csvPath}`);
    if (!fs.existsSync(csvPath)) return {};
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    const data = {};
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 3) continue;
        const res = parts[0];
        const cat = parts[1];
        const item = parts[2];
        const img = parts.length > 3 ? parts[3] : "";

        if (!data[res]) data[res] = {};
        if (!data[res][cat]) data[res][cat] = [];
        data[res][cat].push({ name: item, image: img });
    }
    return data;
}

const FEED_MAP = [
    { name: "Dwaraka Restaurant", csvName: "Dwaraka", file: "../src/components/RestaurantComponents/DwarakaMenu/DwarakaMenu.jsx", varName: "menuData", type: "object_arrays" },
    { name: "Hotel Nandini Deluxe", csvName: "Hotel Nandini Deluxe", file: "../src/components/RestaurantComponents/NandiniMenu/NandiniMenu.jsx", varName: "menuData", type: "object_arrays" },
    { name: "Aras Grand", csvName: "Aras Grand", file: "../src/components/RestaurantComponents/ArasGrandMenu/ArasGrandMenu.jsx", varName: "menuData", type: "array_sections", titleKey: "title" },
    { name: "Malasa Mangally Hotel", csvName: "Malasa Mangally Hotel", file: "../src/components/RestaurantComponents/MalasaMangalyaMenu/MalasaMangalyaMenu.jsx", varName: "menuData", type: "array_sections", titleKey: "title" },
    { name: "FoodRiders Cafe", csvName: "Foodriders Cafe", file: "../src/components/RestaurantComponents/FoodridersMenu/FoodridersMenu.jsx", varName: "foodridersCafeMenu", type: "object_objects" },
    { name: "Shankar Idli Center", csvName: "Shankar Idli Center", file: "../src/components/RestaurantComponents/ShankarIdliMenu/ShankarIdliMenu.jsx", varName: "menuData", type: "array_sections", titleKey: "category" },
    { name: "Dovanagere Bennedose Center", csvName: "Davanagere Benne Dose Center", file: "../src/components/RestaurantComponents/DavanagereMenu/DavanagereMenu.jsx", varName: "menuData", type: "array_sections", titleKey: "category" }
];

async function runSeeding() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const MANIFEST = getManifest();
        const CSV_DATA = getCsvData(path.join(__dirname, '../FoodRiders_Complete_Menu_Report_Exhaustive.csv'));

        console.log(`Loaded Manifest: ${Object.keys(MANIFEST).length} items`);

        // Resolve Image Helper
        function resolveImage(resName, catName, itemName, currentImage) {
            // Keep existing valid images
            if (currentImage && currentImage.length > 5 && !currentImage.includes("default.jpg")) return currentImage;

            let resKey = normalize(resName);
            if (resKey.includes("foodriders")) resKey = "foodriderscafe";
            if (resKey.includes("dwaraka")) resKey = "dwaraka";
            if (resKey.includes("malasa")) resKey = "malasamangalya";
            if (resKey.includes("basaveshwar")) resKey = "basaveshwarkhanavali";

            // Try all permutations of keys if needed, but standard is res|cat|item
            const key = `${resKey}|${normalize(catName)}|${normalize(itemName)}`;
            if (MANIFEST[key]) return MANIFEST[key];

            return "";
        }

        for (const task of FEED_MAP) {
            console.log(`\n--- Processing ${task.name} ---`);
            let categories = [];
            const filePath = path.join(__dirname, task.file);

            // 1. Code Extraction
            if (fs.existsSync(filePath)) {
                // console.log(`  Extracting from ${task.file}`);
                const raw = fs.readFileSync(filePath, 'utf8');
                const data = extractVariable(raw, task.varName);

                if (data) {
                    const fmt = (i) => ({
                        name: i.name,
                        price: i.price || (i.sizes && i.sizes.length > 0 ? i.sizes[0].price : 0),
                        image: i.image || "",
                        description: i.description || "",
                        isAvailable: true,
                        sizes: i.sizes || []
                    });

                    if (task.type === "object_arrays") {
                        for (const [k, v] of Object.entries(data)) {
                            let t = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                            if (Array.isArray(v)) categories.push({ name: t, items: v.map(fmt) });
                            else if (typeof v === 'object') {
                                for (const [sk, sv] of Object.entries(v)) {
                                    let st = sk.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                                    if (Array.isArray(sv)) categories.push({ name: `${t} - ${st}`, items: sv.map(fmt) });
                                }
                            }
                        }
                    } else if (task.type === "array_sections") {
                        categories = data.map(s => ({
                            name: s[task.titleKey || 'title'] || s.category,
                            items: s.items.map(fmt)
                        }));
                    } else if (task.type === "object_objects") {
                        for (const [ck, cv] of Object.entries(data)) {
                            let t = ck.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                            const items = [];
                            for (const [inm, idt] of Object.entries(cv)) {
                                if (typeof idt === 'number') items.push({ name: inm, price: idt, isAvailable: true, sizes: [], image: "" });
                                else {
                                    let prices = idt.prices ? Object.entries(idt.prices).map(([sz, pr]) => ({ size: sz, price: pr })) : [];
                                    items.push({
                                        name: inm, price: prices.length > 0 ? prices[0].price : (idt.price || 0),
                                        image: idt.image || "", description: idt.description || "", sizes: prices, isAvailable: true
                                    });
                                }
                            }
                            categories.push({ name: t, items });
                        }
                    }
                } else console.log("  Extraction returned null");
            } else console.log("  File not found");

            // 2. CSV Merge & Image Fix
            const targetCsvData = CSV_DATA[task.csvName] || CSV_DATA[task.name];
            if (targetCsvData) {
                // console.log(`  Merging CSV Data...`);
                for (const [cName, cItems] of Object.entries(targetCsvData)) {
                    let cat = categories.find(c => normalize(c.name) === normalize(cName));
                    if (!cat) {
                        cat = { name: cName, items: [] };
                        categories.push(cat);
                    }
                    for (const ci of cItems) {
                        let item = cat.items.find(i => normalize(i.name) === normalize(ci.name));
                        const bestImg = resolveImage(task.name, cName, ci.name, item ? item.image : ci.image);

                        if (item) {
                            if (!item.image || item.image.length < 5) item.image = bestImg;
                        } else {
                            cat.items.push({
                                name: ci.name, price: 150, image: bestImg, description: "Extended Menu", isAvailable: true, sizes: []
                            });
                        }
                    }
                }
            } else console.log(`  No CSV data found for ${task.csvName}`);

            // 3. Update DB
            // console.log(`  Updating DB for ${task.name}...`);
            // Fetch existing metadata to preserve
            const existingRes = await Restaurant.findOne({ name: task.name }).lean();

            const meta = {
                address: existingRes ? existingRes.address : "Mahalingapura",
                rating: existingRes ? existingRes.rating : 4.2,
                deliveryTime: existingRes ? existingRes.deliveryTime : 30,
                image: existingRes ? existingRes.image : "",
                location: existingRes ? existingRes.location : { lat: 16.3860, lng: 75.1202 },
                tags: existingRes ? existingRes.tags : ["Vegetarian"],
                deliveryRadius: existingRes ? existingRes.deliveryRadius : 5
            };

            // Sanitize
            categories.forEach(c => {
                c.items.forEach(i => {
                    i.price = Number(i.price) || 0;
                    i.image = String(i.image || "");
                    i.description = String(i.description || "");
                    i.isAvailable = !!i.isAvailable;
                    if (i.sizes) {
                        i.sizes.forEach(s => {
                            s.price = Number(s.price) || 0;
                            s.size = String(s.size || "");
                        });
                    }
                });
            });

            // Clean data
            const cleanCategories = JSON.parse(JSON.stringify(categories));

            console.log(`  Deleting existing ${task.name}...`);
            await Restaurant.deleteOne({ name: task.name });

            console.log(`  Creating new ${task.name}...`);
            await Restaurant.create({
                name: task.name,
                categories: cleanCategories,
                ...meta
            });
            console.log(`  Created ${task.name}.`);

            const total = categories.reduce((s, c) => s + c.items.length, 0);
            console.log(`  > Final Count: ${total} items`);
        }

        console.log("\nSeeding Complete.");

        // Final check
        const all = await Restaurant.find({});
        let grand = 0;
        all.forEach(r => r.categories.forEach(c => grand += c.items.length));
        console.log(`Grand Total in DB: ${grand}`);

        process.exit(0);
    } catch (e) {
        console.error("FATAL ERROR:", e);
        process.exit(1);
    }
}

runSeeding();
