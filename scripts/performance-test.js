#!/usr/bin/env node

/**
 * Performance Testing Script for WebGIS Deli Serdang
 * 
 * This script tests the performance of all major features and generates a report.
 * 
 * Usage:
 *   node scripts/performance-test.js
 * 
 * Requirements:
 *   - Application must be running on localhost:3000 or localhost:3001
 *   - Node.js 18+ with fetch API support
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const TIMEOUT = 30000; // 30 seconds
const RESULTS_FILE = path.join(__dirname, '..', 'performance-results.json');

// Test scenarios
const scenarios = [
    {
        name: 'Home Page',
        url: '/',
        expectedTime: 4000, // 4 seconds
        critical: true
    },
    {
        name: 'Login Page',
        url: '/login',
        expectedTime: 3000,
        critical: true
    },
    {
        name: 'Dashboard',
        url: '/dashboard',
        expectedTime: 5000,
        critical: true,
        requiresAuth: true
    },
    {
        name: 'Daerah Irigasi List',
        url: '/daerah-irigasi/12120010', // First DI
        expectedTime: 10000,
        critical: true
    },
    {
        name: 'Map View (No DI)',
        url: '/map',
        expectedTime: 15000,
        critical: true
    },
    {
        name: 'Map View (With DI)',
        url: '/map?k_di=12120010',
        expectedTime: 30000,
        critical: true
    }
];

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function getStatus(actualTime, expectedTime) {
    if (actualTime <= expectedTime * 0.7) return { text: '✅ EXCELLENT', color: 'green' };
    if (actualTime <= expectedTime) return { text: '✓ GOOD', color: 'cyan' };
    if (actualTime <= expectedTime * 1.5) return { text: '⚠ SLOW', color: 'yellow' };
    return { text: '❌ CRITICAL', color: 'red' };
}

async function testEndpoint(scenario) {
    log(`\nTesting: ${scenario.name}`, 'bright');
    log(`URL: ${BASE_URL}${scenario.url}`, 'blue');

    const startTime = Date.now();
    let status = 'success';
    let error = null;
    let responseTime = 0;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await fetch(`${BASE_URL}${scenario.url}`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Performance-Test-Script/1.0'
            }
        });

        clearTimeout(timeoutId);
        responseTime = Date.now() - startTime;

        if (!response.ok) {
            status = 'error';
            error = `HTTP ${response.status}: ${response.statusText}`;
        }

    } catch (err) {
        responseTime = Date.now() - startTime;
        status = 'error';
        error = err.name === 'AbortError' ? 'Timeout' : err.message;
    }

    const result = getStatus(responseTime, scenario.expectedTime);

    log(`Response Time: ${formatTime(responseTime)}`, result.color);
    log(`Expected: ${formatTime(scenario.expectedTime)}`, 'blue');
    log(`Status: ${result.text}`, result.color);

    if (error) {
        log(`Error: ${error}`, 'red');
    }

    return {
        scenario: scenario.name,
        url: scenario.url,
        responseTime,
        expectedTime: scenario.expectedTime,
        status: result.text,
        error,
        timestamp: new Date().toISOString()
    };
}

async function runTests() {
    log('\n' + '='.repeat(60), 'bright');
    log('WebGIS Deli Serdang - Performance Test', 'bright');
    log('='.repeat(60) + '\n', 'bright');

    log(`Base URL: ${BASE_URL}`, 'cyan');
    log(`Timeout: ${formatTime(TIMEOUT)}`, 'cyan');
    log(`Total Scenarios: ${scenarios.length}\n`, 'cyan');

    const results = [];

    for (const scenario of scenarios) {
        if (scenario.requiresAuth) {
            log(`\nSkipping ${scenario.name} (requires authentication)`, 'yellow');
            continue;
        }

        const result = await testEndpoint(scenario);
        results.push(result);

        // Wait a bit between tests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate summary
    log('\n' + '='.repeat(60), 'bright');
    log('SUMMARY', 'bright');
    log('='.repeat(60) + '\n', 'bright');

    const excellent = results.filter(r => r.status.includes('EXCELLENT')).length;
    const good = results.filter(r => r.status.includes('GOOD')).length;
    const slow = results.filter(r => r.status.includes('SLOW')).length;
    const critical = results.filter(r => r.status.includes('CRITICAL')).length;
    const errors = results.filter(r => r.error).length;

    log(`Total Tests: ${results.length}`, 'cyan');
    log(`✅ Excellent: ${excellent}`, 'green');
    log(`✓ Good: ${good}`, 'cyan');
    log(`⚠ Slow: ${slow}`, 'yellow');
    log(`❌ Critical: ${critical}`, 'red');
    log(`🔥 Errors: ${errors}`, 'red');

    const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    log(`\nAverage Response Time: ${formatTime(avgTime)}`, 'bright');

    // Save results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        summary: {
            total: results.length,
            excellent,
            good,
            slow,
            critical,
            errors,
            averageTime: avgTime
        },
        results
    };

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(reportData, null, 2));
    log(`\nResults saved to: ${RESULTS_FILE}`, 'green');

    // Generate recommendations
    log('\n' + '='.repeat(60), 'bright');
    log('RECOMMENDATIONS', 'bright');
    log('='.repeat(60) + '\n', 'bright');

    if (critical > 0 || slow > 0) {
        log('⚠️  Performance issues detected!', 'yellow');
        log('\nPriority actions:', 'bright');

        results.forEach(r => {
            if (r.status.includes('CRITICAL') || r.status.includes('SLOW')) {
                log(`\n• ${r.scenario}:`, 'yellow');
                log(`  Current: ${formatTime(r.responseTime)}`, 'red');
                log(`  Target: ${formatTime(r.expectedTime)}`, 'green');
                log(`  Improvement needed: ${formatTime(r.responseTime - r.expectedTime)}`, 'yellow');
            }
        });

        log('\nRefer to PERFORMANCE_ANALYSIS.md for detailed solutions.', 'cyan');
    } else {
        log('✅ All tests passed! Performance is good.', 'green');
    }

    log('\n' + '='.repeat(60) + '\n', 'bright');

    // Exit with error code if there are critical issues
    if (critical > 0 || errors > 0) {
        process.exit(1);
    }
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
        });
        return response.ok || response.status === 404; // 404 is ok, means server is running
    } catch (err) {
        return false;
    }
}

// Main execution
(async () => {
    log('Checking if server is running...', 'cyan');

    const isRunning = await checkServer();

    if (!isRunning) {
        log(`\n❌ Server is not running at ${BASE_URL}`, 'red');
        log('Please start the development server first:', 'yellow');
        log('  npm run dev\n', 'cyan');
        process.exit(1);
    }

    log('✓ Server is running\n', 'green');

    await runTests();
})();
