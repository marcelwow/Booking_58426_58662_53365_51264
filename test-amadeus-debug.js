const Amadeus = require('amadeus');

console.log('🔍 Testowanie różnych konfiguracji Amadeus...\n');

// Test 1: Domyślna konfiguracja
async function test1() {
    console.log('📝 TEST 1: Standardowa konfiguracja');
    try {
        const amadeus = new Amadeus({
            clientId: 'O6q1VsEcohcGRkfzTgmMAjSU0mxhT-1a',
            clientSecret: 'G30w16HRmxQ2InT3'
        });
        
        const response = await amadeus.referenceData.locations.airports.get({
            keyword: 'LON',
            'page[limit]': 1
        });
        
        console.log('✅ TEST 1: SUKCES!');
        return true;
    } catch (error) {
        console.log('❌ TEST 1: BŁĄD:', error.description?.error_description || error.message);
        return false;
    }
}

// Test 2: Z hostname test
async function test2() {
    console.log('\n📝 TEST 2: Z explicit hostname');
    try {
        const amadeus = new Amadeus({
            clientId: 'O6q1VsEcohcGRkfzTgmMAjSU0mxhT-1a',
            clientSecret: 'G30w16HRmxQ2InT3',
            hostname: 'test.api.amadeus.com'
        });
        
        const response = await amadeus.referenceData.locations.airports.get({
            keyword: 'LON',
            'page[limit]': 1
        });
        
        console.log('✅ TEST 2: SUKCES!');
        return true;
    } catch (error) {
        console.log('❌ TEST 2: BŁĄD:', error.description?.error_description || error.message);
        return false;
    }
}

// Test 3: Z pełną konfiguracją
async function test3() {
    console.log('\n📝 TEST 3: Z pełną konfiguracją');
    try {
        const amadeus = new Amadeus({
            clientId: 'O6q1VsEcohcGRkfzTgmMAjSU0mxhT-1a',
            clientSecret: 'G30w16HRmxQ2InT3',
            hostname: 'test.api.amadeus.com',
            ssl: true,
            port: 443
        });
        
        const response = await amadeus.referenceData.locations.airports.get({
            keyword: 'LON',
            'page[limit]': 1
        });
        
        console.log('✅ TEST 3: SUKCES!');
        return true;
    } catch (error) {
        console.log('❌ TEST 3: BŁĄD:', error.description?.error_description || error.message);
        console.log('📋 Szczegóły błędu:', error.response?.statusCode, error.response?.request?.verb, error.response?.request?.path);
        return false;
    }
}

// Test 4: Sprawdź wersję biblioteki
function test4() {
    console.log('\n📝 TEST 4: Informacje o bibliotece');
    try {
        const amadeusPackage = require('./node_modules/amadeus/package.json');
        console.log('📦 Wersja biblioteki Amadeus:', amadeusPackage.version);
        
        const nodeVersion = process.version;
        console.log('🟢 Wersja Node.js:', nodeVersion);
        
        return true;
    } catch (error) {
        console.log('❌ Nie można sprawdzić wersji:', error.message);
        return false;
    }
}

// Uruchom wszystkie testy
async function runAllTests() {
    console.log('🚀 Rozpoczynam testy debugowania Amadeus...\n');
    
    test4();
    
    const test1Result = await test1();
    const test2Result = await test2();
    const test3Result = await test3();
    
    console.log('\n📊 PODSUMOWANIE:');
    console.log('Test 1 (standardowy):', test1Result ? '✅' : '❌');
    console.log('Test 2 (z hostname):', test2Result ? '✅' : '❌');
    console.log('Test 3 (pełna konfig):', test3Result ? '✅' : '❌');
    
    if (!test1Result && !test2Result && !test3Result) {
        console.log('\n🔍 WSZYSTKIE TESTY NIEUDANE - możliwe przyczyny:');
        console.log('1. Klucze mogą być nieaktywne (mimo że wyglądają dobrze)');
        console.log('2. Problem z biblioteką amadeus');
        console.log('3. Ograniczenia sieciowe/firewall');
        console.log('4. Problem z kontem Amadeus');
    }
}

runAllTests(); 