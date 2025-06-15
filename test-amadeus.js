// Prosty test Amadeus API
const Amadeus = require('amadeus');

// Klucze z .env
const amadeus = new Amadeus({
    clientId: 'O6q1VsEcohcGRkfzTgmMAjSU0mxhT-1a',
    clientSecret: 'G30w16HRmxQ2InT3'
});

async function testAmadeus() {
    try {
        console.log('🔍 Testuję połączenie z Amadeus...');
        
        // Najprostszy test - pobranie tokenu
        const response = await amadeus.referenceData.locations.airports.get({
            keyword: 'PAR',
            'page[limit]': 1
        });
        
        console.log('✅ SUKCES! API Amadeus działa!');
        console.log('📍 Znaleziono lotnisko:', response.data[0]?.name);
        
    } catch (error) {
        console.log('❌ BŁĄD API Amadeus:');
        console.log('Status:', error.response?.statusCode);
        console.log('Błąd:', error.description?.error_description || error.message);
        
        if (error.description?.error === 'invalid_client') {
            console.log('🔑 Problem z kluczami API - sprawdź:');
            console.log('1. Czy aplikacja na Amadeus jest aktywna?');
            console.log('2. Czy klucze są z trybu TEST?');
            console.log('3. Czy API są włączone w aplikacji?');
        }
    }
}

testAmadeus(); 