import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchFolder(githubApiUrl, outputFilename) {
    console.log(`\nFetching list of files from ${githubApiUrl}...`);
    
    try {
        const folderResponse = await fetch(githubApiUrl);
        if (!folderResponse.ok) throw new Error('Failed to fetch folder contents');
        const files = await folderResponse.json();

        const combinedData = [];

        for (const file of files) {
            if (file.name.endsWith('.json')) {
                console.log(`Downloading ${file.name}...`);
                const fileResponse = await fetch(file.download_url);
                const itemData = await fileResponse.json();
                
                combinedData.push(itemData);
                
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        saveToFile(combinedData, outputFilename);
    } catch (error) {
        console.error(`Error building ${outputFilename}:`, error);
    }
}

async function fetchSingleFile(url, outputFilename) {
    console.log(`\nFetching ${outputFilename} directly from ${url}...`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch single file');
        const data = await response.json();

        const dataArray = Array.isArray(data) ? data : Object.values(data);
        
        saveToFile(dataArray, outputFilename);
    } catch (error) {
        console.error(`Error building ${outputFilename}:`, error);
    }
}

async function fetchCodesData(url, outputFilename) {
    console.log(`\nFetching ${outputFilename} directly from ${url}...`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch codes data');
        const data = await response.json();

        const codesArray = data.codes ? data.codes : [];
        
        saveToFile(codesArray, outputFilename);
    } catch (error) {
        console.error(`Error building ${outputFilename}:`, error);
    }
}

function saveToFile(data, outputFilename) {
    const outputDir = path.resolve(__dirname, '../public/data');
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`Success! Saved ${data.length} items into public/data/${outputFilename}`);
}

async function buildDatabase() {
    // Characters Data
    await fetchFolder('https://api.github.com/repos/MadeBaruna/paimon-moe/contents/src/data/characterData', 'characters.json');
    
    // Weapons Data
    await fetchSingleFile('https://raw.githubusercontent.com/MadeBaruna/paimon-moe/refs/heads/main/src/data/weapons/en.json', 'weaponList.json');

    // Redeem Codes Data
    await fetchCodesData('https://hoyo-codes.seria.moe/codes?game=genshin', 'codes.json');
}

buildDatabase();