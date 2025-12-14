import * as turf from '@turf/turf';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Segment a LineString into ~50m ruas segments
 * @param {number[][]} coordinates - LineString coordinates
 * @param {number} targetLength - Target segment length in meters (default 50)
 * @returns {Array} Array of segment coordinates
 */
function segmentLineString(coordinates, targetLength = 50) {
    if (!coordinates || coordinates.length < 2) {
        throw new Error('Invalid coordinates: need at least 2 points');
    }

    const line = turf.lineString(coordinates);
    const totalLength = turf.length(line, { units: 'meters' });

    if (totalLength === 0) {
        console.warn('⚠️  LineString has zero length');
        return [coordinates];
    }

    const numSegments = Math.ceil(totalLength / targetLength);
    const segments = [];

    for (let i = 0; i < numSegments; i++) {
        const start = i * targetLength;
        const end = Math.min(start + targetLength, totalLength);

        try {
            const slice = turf.lineSliceAlong(line, start, end, { units: 'meters' });
            segments.push(slice.geometry.coordinates);
        } catch (err) {
            console.error(`Error slicing segment ${i}: ${err.message}`);
            // Fallback: include remaining coordinates
            segments.push(coordinates);
            break;
        }
    }

    return segments;
}

/**
 * Generate properties for a ruas feature
 * @param {number} ruasIndex - Ruas number (1, 2, 3...)
 * @param {number[][]} coordinates - Ruas coordinates
 * @param {object} parentProps - Parent saluran properties
 * @param {string} k_di - DI code
 * @param {number} featureId - Unique feature ID
 * @returns {object} Ruas properties
 */
function generateRuasProperties(ruasIndex, coordinates, parentProps, k_di, featureId) {
    const no_saluran = parentProps.no_saluran;

    if (!no_saluran) {
        throw new Error('Missing no_saluran in parent properties');
    }

    const ruasLine = turf.lineString(coordinates);
    const lengthInDegrees = turf.length(ruasLine, { units: 'degrees' });

    return {
        ...parentProps,  // Copy all parent properties
        no_ruas: ruasIndex,
        img_urls: `https://yyagythhwzdncantoszf.supabase.co/storage/v1/object/public/images/${k_di}/${no_saluran}/Ruas - ${ruasIndex}.webp`,
        Shape_Leng: lengthInDegrees,
        nn: featureId
    };
}

/**
 * Process a single DI's Saluran file
 * @param {string} k_di - DI code
 * @param {string} fileName - Saluran filename
 * @param {boolean} dryRun - If true, don't upload, just return result
 * @returns {object} Processing result
 */
async function processDISaluran(k_di, fileName, dryRun = false) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  Processing: ${k_di} - ${fileName}`);
    console.log(`${'═'.repeat(60)}\n`);

    const filePath = `${k_di}/${fileName}`;

    // Step 1: Download original file
    console.log('📥 Downloading original file...');
    const { data: fileData, error: downloadError } = await supabase.storage
        .from('geojson')
        .download(filePath);

    if (downloadError) {
        console.error('❌ Download error:', downloadError.message);
        return { success: false, error: downloadError.message };
    }

    const originalText = await fileData.text();
    const originalGeoJSON = JSON.parse(originalText);
    const originalFeatures = originalGeoJSON.features || [];

    console.log(`✅ Downloaded: ${originalFeatures.length} features\n`);

    // Step 2: Validate input
    const featuresWithNoSaluran = originalFeatures.filter(f => f.properties?.no_saluran);

    if (featuresWithNoSaluran.length === 0) {
        console.error('❌ No features have no_saluran field!');
        return { success: false, error: 'Missing no_saluran field' };
    }

    console.log(`✅ Validation: ${featuresWithNoSaluran.length}/${originalFeatures.length} features have no_saluran\n`);

    // Step 3: Backup original
    if (!dryRun) {
        console.log('💾 Creating backup...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `backup/${k_di}/${fileName.replace('.json', `_backup_${timestamp}.json`)}`;

        const { error: backupError } = await supabase.storage
            .from('geojson')
            .upload(backupPath, originalText, { contentType: 'application/json', upsert: false });

        if (backupError) {
            console.warn(`⚠️  Backup warning: ${backupError.message}`);
        } else {
            console.log(`✅ Backup saved: ${backupPath}\n`);
        }
    }

    // Step 4: Process each feature
    console.log('🔨 Segmenting features...\n');

    const processedFeatures = [];
    let featureIdCounter = 1;
    let totalRuasCreated = 0;

    for (let i = 0; i < originalFeatures.length; i++) {
        const feature = originalFeatures[i];
        const props = feature.properties || {};
        const no_saluran = props.no_saluran;

        if (!no_saluran) {
            console.log(`⚠️  Skipping feature ${i + 1} (no no_saluran)`);
            continue;
        }

        if (feature.geometry?.type !== 'LineString') {
            console.log(`⚠️  Skipping feature ${i + 1} (not LineString)`);
            continue;
        }

        const coordinates = feature.geometry.coordinates;

        try {
            const segments = segmentLineString(coordinates, 50);

            console.log(`  Saluran ${no_saluran}: ${segments.length} ruas (${turf.length(turf.lineString(coordinates), { units: 'meters' }).toFixed(1)}m)`);

            for (let j = 0; j < segments.length; j++) {
                const ruasIndex = j + 1;
                const ruasProps = generateRuasProperties(ruasIndex, segments[j], props, k_di, featureIdCounter);

                processedFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: segments[j]
                    },
                    properties: ruasProps
                });

                featureIdCounter++;
                totalRuasCreated++;
            }
        } catch (err) {
            console.error(`❌ Error processing feature ${i + 1}:`, err.message);
        }
    }

    console.log(`\n✅ Total ruas created: ${totalRuasCreated}\n`);

    // Step 5: Create output GeoJSON
    const outputGeoJSON = {
        type: 'FeatureCollection',
        features: processedFeatures
    };

    // Step 6: Upload result
    if (!dryRun) {
        console.log('📤 Uploading processed file...');

        const { error: uploadError } = await supabase.storage
            .from('geojson')
            .upload(filePath, JSON.stringify(outputGeoJSON, null, 2), {
                contentType: 'application/json',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Upload error:', uploadError.message);
            return { success: false, error: uploadError.message };
        }

        console.log('✅ Upload complete!\n');
    } else {
        console.log('🔍 DRY RUN: Skipping upload\n');
        // Save to local for inspection
        const localPath = `temp-processed-${k_di}.json`;
        fs.writeFileSync(localPath, JSON.stringify(outputGeoJSON, null, 2));
        console.log(`💾 Saved to: ${localPath}\n`);
    }

    return {
        success: true,
        k_di,
        fileName,
        originalFeatures: originalFeatures.length,
        processedFeatures: processedFeatures.length,
        output: outputGeoJSON
    };
}

// Export functions
export { segmentLineString, generateRuasProperties, processDISaluran };
