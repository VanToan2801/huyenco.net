const baziCalculator = require('./src/bazi/calculator');
const { formatOutput } = require('./src/bazi/output');
const { calculateDaiVan } = require('./src/bazi/dayun');

function getPromptData(dateStr, isFemale = false) {
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
        isFemale,
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

    return { baziContext, luckCyclesData };
}

// Test 1: 20/10/1998
const data1 = getPromptData('20/10/1998', false);
console.log('--- 20/10/1998 ---');
console.log('NGAY_DUONG_LICH:', data1.baziContext.thong_tin_co_ban.ngay_duong_lich);
console.log('NGAY_SINH_DUONG (missing):', data1.baziContext.thong_tin_co_ban.ngay_sinh_duong);
console.log('PILLARS:', data1.baziContext.thong_tin_co_ban.bat_tu);

// Test 2: 28/01/2003
const data2 = getPromptData('28/01/2003', false);
console.log('\n--- 28/01/2003 ---');
console.log('NGAY_DUONG_LICH:', data2.baziContext.thong_tin_co_ban.ngay_duong_lich);
console.log('NGAY_SINH_DUONG (missing):', data2.baziContext.thong_tin_co_ban.ngay_sinh_duong);
console.log('PILLARS:', data2.baziContext.thong_tin_co_ban.bat_tu);
