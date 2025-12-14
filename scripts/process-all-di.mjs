#!/usr/bin/env node
import { processDISaluran } from './segment-ruas-engine.mjs';

const DI_LIST = [
    { k_di: '12120005', name: 'Lau_Simeme' },
    { k_di: '12120009', name: 'Paya_Bakung_II' },
    { k_di: '12120010', name: 'Paya_Bakung_III' },
    { k_di: '12120011', name: 'Sibolangit' },
    { k_di: '12120031', name: 'Buluh_Awar' },
    { k_di: '12120032', name: 'Buluh_Nipes' },
    { k_di: '12120051', name: 'Kota_Datar' },
    { k_di: '12120052', name: 'Kota_Rantang' },
    { k_di: '12120058', name: 'Lantasan_Baru' },
    { k_di: '12120063', name: 'Mba_Ruai' },
    { k_di: '12120066', name: 'Namo_Suro_Baru' },
    { k_di: '12120077', name: 'Rumah_Kinangkung' },
    { k_di: '12120078', name: 'Rumah_Pil-pil' },
    { k_di: '12120087', name: 'Sikeben' }
];

async function main() {
    const args = process.argv.slice(2);

    // Parse arguments
    const dryRun = args.includes('--dry-run');
    const specificDI = args.find(arg => arg.startsWith('--di='))?.split('=')[1];

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  🚀 RUAS SEGMENTATION PROCESSOR');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE: No files will be uploaded\n');
    }

    let targetList = DI_LIST;

    if (specificDI) {
        const di = DI_LIST.find(d => d.k_di === specificDI);
        if (!di) {
            console.error(`❌ DI ${specificDI} not found!`);
            console.log('\nAvailable DI codes:');
            DI_LIST.forEach(d => console.log(`  - ${d.k_di} (${d.name})`));
            process.exit(1);
        }
        targetList = [di];
        console.log(`🎯 Target: Single DI ${specificDI}\n`);
    } else {
        console.log(`🎯 Target: ALL ${DI_LIST.length} DI\n`);
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const di of targetList) {
        const fileName = `${di.name}_Saluran.json`;

        try {
            const result = await processDISaluran(di.k_di, fileName, dryRun);

            if (result.success) {
                successCount++;
                console.log(`✅ SUCCESS: ${di.k_di}\n`);
            } else {
                failCount++;
                console.log(`❌ FAILED: ${di.k_di} - ${result.error}\n`);
            }

            results.push(result);

        } catch (error) {
            failCount++;
            console.error(`❌ ERROR: ${di.k_di} - ${error.message}\n`);
            results.push({
                success: false,
                k_di: di.k_di,
                fileName,
                error: error.message
            });
        }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Total processed: ${results.length}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}\n`);

    if (successCount > 0) {
        console.log('Successful DI:');
        results.filter(r => r.success).forEach(r => {
            console.log(`  ✅ ${r.k_di}: ${r.originalFeatures} → ${r.processedFeatures} features`);
        });
        console.log('');
    }

    if (failCount > 0) {
        console.log('Failed DI:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  ❌ ${r.k_di}: ${r.error}`);
        });
        console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(failCount > 0 ? 1 : 0);
}

// Show usage
if (process.argv.includes('--help')) {
    console.log(`
Usage: node process-all-di.mjs [options]

Options:
  --dry-run        Don't upload, just test segmentation
  --di=<code>      Process only specific DI (e.g., --di=12120005)
  --help           Show this help

Examples:
  node process-all-di.mjs                    # Process all 14 DI
  node process-all-di.mjs --dry-run          # Test without uploading
  node process-all-di.mjs --di=12120005      # Process only Lau Simeme
  node process-all-di.mjs --di=12120009 --dry-run  # Test Paya Bakung II
`);
    process.exit(0);
}

main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
});
