const openRouterService = require('./src/services/openrouter.service');
const baziCalculator = require('./src/bazi/calculator');
const { formatOutput } = require('./src/bazi/output');
const { calculateDaiVan } = require('./src/bazi/dayun');

function testPrompt(dateStr, displayname) {
    const parts = dateStr.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    const calc = new baziCalculator({
        name: 'Khách TikTok',
        year,
        month,
        day,
        hour: 12,
        minute: 0,
        isFemale: false,
        isSolar: true,
    });

    const ctx = calc.calculate();
    const fullOutput = formatOutput(ctx);
    const daiVanData = calculateDaiVan(ctx);

    const baziContext = {
        thong_tin_co_ban: fullOutput.thong_tin_co_ban,
        chi_tiet_tru: fullOutput.chi_tiet_tru,
        phan_tich: fullOutput.phan_tich,
    };
    const luckCyclesData = { dai_van: daiVanData };

    // Use private method via reflection or just call the public one that uses it
    // Actually buildUserPrompt is not exported but I can test the whole generateAnswer flow or just peek at the code
    const prompt = openRouterService.buildUserPrompt(baziContext, luckCyclesData, "khi nào tình duyên đến?", 'huyen_co', null, displayname);
    
    console.log(`\n--- TEST FOR ${dateStr} (${displayname}) ---`);
    console.log(prompt);
}

testPrompt('20/10/1998', 'toantruongvan');
testPrompt('28/01/2003', 'toantruongvan');
