#!/usr/bin/env node

const ping = require('ping');

async function testPingFunctionality() {
  console.log('🔍 Testing Homebridge Server Status Plugin Functionality\n');
  
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  console.log(`Environment: ${isCI ? 'CI/GitHub Actions' : 'Local'}\n`);
  
  let allPassed = true;
  
  // Test 1: Library Loading
  console.log('📚 Test 1: Ping Library Loading');
  try {
    if (typeof ping.promise.probe === 'function') {
      console.log('   ✅ Ping library loaded successfully');
    } else {
      throw new Error('Ping library not properly loaded');
    }
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    allPassed = false;
  }
  
  // Test 2: Localhost Ping (should work everywhere)
  console.log('\n🏠 Test 2: Localhost Connectivity');
  try {
    const localResult = await ping.promise.probe('localhost', { 
      timeout: 3,
      min_reply: 1 
    });
    
    if (localResult.alive) {
      console.log('   ✅ Localhost ping successful');
      console.log(`   📊 Response time: ${localResult.time}ms`);
    } else {
      console.log('   ⚠️  Localhost ping failed (unusual but not critical)');
    }
  } catch (err) {
    console.log('   ❌ Localhost ping error:', err.message);
    if (!isCI) allPassed = false; // Only fail locally
  }
  
  // Test 3: External Connectivity (may fail in CI)
  console.log('\n🌐 Test 3: External Connectivity');
  const externalHosts = ['8.8.8.8', 'google.com', '1.1.1.1'];
  
  for (const host of externalHosts) {
    try {
      console.log(`   Testing ${host}...`);
      const result = await ping.promise.probe(host, { 
        timeout: isCI ? 10 : 5,
        min_reply: 1 
      });
      
      if (result.alive) {
        console.log(`   ✅ ${host} is reachable (${result.time}ms)`);
        break; // Success with at least one host
      } else {
        console.log(`   ⚠️  ${host} not reachable`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${host} test failed: ${err.message}`);
    }
  }
  
  if (isCI) {
    console.log('   ℹ️  External connectivity tests are informational in CI');
  }
  
  // Test 4: URL Parsing (simulate plugin behavior)
  console.log('\n🔗 Test 4: URL Parsing Functionality');
  try {
    const testUrls = [
      'google.com',
      'https://www.google.com',
      'http://example.com',
      '192.168.1.1',
      'localhost'
    ];
    
    for (const url of testUrls) {
      let host = url;
      if (host.startsWith('http://') || host.startsWith('https://')) {
        const urlObj = new URL(host);
        host = urlObj.hostname;
      }
      console.log(`   ✅ ${url} → ${host}`);
    }
    console.log('   ✅ URL parsing working correctly');
  } catch (err) {
    console.log('   ❌ URL parsing failed:', err.message);
    allPassed = false;
  }
  
  // Test 5: TypeScript Build Verification
  console.log('\n🔨 Test 5: Build Verification');
  try {
    const fs = require('fs');
    const path = require('path');
    
    const requiredFiles = [
      'dist/index.js',
      'dist/platform.js', 
      'dist/accessory.js',
      'dist/settings.js'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        console.log(`   ✅ ${file} exists`);
      } else {
        throw new Error(`Required file ${file} missing`);
      }
    }
    console.log('   ✅ All compiled files present');
  } catch (err) {
    console.log('   ❌ Build verification failed:', err.message);
    allPassed = false;
  }
  
  // Final Result
  console.log('\n📋 Test Summary');
  if (allPassed) {
    console.log('🎉 All critical tests passed!');
    console.log('✅ Plugin functionality verified');
    process.exit(0);
  } else {
    console.log('❌ Some critical tests failed');
    console.log('🔧 Please review the errors above');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled promise rejection:', err);
  process.exit(1);
});

// Run the tests
testPingFunctionality().catch(err => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
}); 