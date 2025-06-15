const Amadeus = require('amadeus');
const config = require('../src/config');
const alternativeHotelService = require('./alternativeHotelService');

// Dodajemy debugowanie
console.log('Config values:');
console.log('AMADEUS_CLIENT_ID:', config.AMADEUS_CLIENT_ID);
console.log('AMADEUS_CLIENT_SECRET:', config.AMADEUS_CLIENT_SECRET);

// Inicjalizacja Amadeus client
const amadeus = new Amadeus({
    clientId: config.AMADEUS_CLIENT_ID,
    clientSecret: config.AMADEUS_CLIENT_SECRET
});

class AmadeusService {
    /**
     * Wyszukuje hotele w podanym mieście
     * @param {string} cityCode - Kod miasta (np. PAR dla Paryża)
     * @param {number} adults - Liczba dorosłych
     * @param {string} checkInDate - Data zameldowania (YYYY-MM-DD)
     * @param {string} checkOutDate - Data wymeldowania (YYYY-MM-DD)
     * @returns {Promise<Array>} - Lista hoteli
     */
    async searchHotels(cityCode, adults = 1, checkInDate, checkOutDate) {
        try {
            console.log(`Wyszukiwanie hoteli w ${cityCode} dla ${adults} osób, ${checkInDate} - ${checkOutDate}`);
            
            // Znajdź nazwę miasta dla kodu
            let cityName = this.getCityNameFromCode(cityCode);
            
            // Spróbuj użyć API Amadeus
            try {
                // Sprawdź czy amadeus.shopping.hotelOffers istnieje
                if (amadeus && amadeus.shopping && amadeus.shopping.hotelOffers) {
                    const response = await amadeus.shopping.hotelOffers.get({
                        cityCode: cityCode,
                        adults: adults,
                        checkInDate: checkInDate,
                        checkOutDate: checkOutDate,
                        roomQuantity: 1,
                        currency: 'PLN',
                        bestRateOnly: true,
                        includeClosed: false,
                        sort: 'PRICE'
                    });
                    
                    if (response.data && response.data.length > 0) {
                        const formattedHotels = await this.formatHotelOffers(response.data);
                        // Dodaj nazwę miasta do wyników
                        return formattedHotels.map(hotel => ({
                            ...hotel,
                            city: cityName || hotel.city
                        }));
                    }
                } else {
                    console.error('Amadeus API nie jest prawidłowo zainicjalizowane');
                    throw new Error('API niedostępne');
                }
            } catch (apiError) {
                console.error('Błąd API Amadeus podczas wyszukiwania hoteli:', apiError);
                // Kontynuuj do alternatywnego API lub danych mockowych
            }
            
            // Spróbuj użyć alternatywnego API
            try {
                console.log('🔄 Używam alternatywnego API dla:', cityCode);
                if (alternativeHotelService && typeof alternativeHotelService.searchHotels === 'function') {
                    const altResults = await alternativeHotelService.searchHotels(cityCode, adults, checkInDate, checkOutDate);
                    if (altResults && altResults.length > 0) {
                        // Dodaj nazwę miasta do wyników
                        return altResults.map(hotel => ({
                            ...hotel,
                            city: cityName || hotel.city
                        }));
                    }
                }
            } catch (alternativeError) {
                console.error('Błąd alternatywnego API:', alternativeError);
                // Kontynuuj do danych mockowych
            }
            
            // Jeśli wszystko zawiedzie, zwróć dane mockowe
            console.log('Używam danych mockowych dla hoteli w:', cityName || cityCode);
            const mockHotels = this.getMockHotels(cityCode, checkInDate, checkOutDate);
            return mockHotels;
            
        } catch (error) {
            console.error('Błąd podczas wyszukiwania hoteli:', error);
            // Zwróć dane mockowe w przypadku błędu
            return this.getMockHotels(cityCode, checkInDate, checkOutDate);
        }
    }

    /**
     * Wyszukaj hotele w określonym regionie geograficznym
     * @param {number} latitude - Szerokość geograficzna
     * @param {number} longitude - Długość geograficzna  
     * @param {number} radius - Promień wyszukiwania w km (domyślnie 20)
     * @returns {Promise<Array>} - Lista hoteli
     */
    async searchHotelsByLocation(latitude, longitude, radius = 20) {
        try {
            const response = await amadeus.referenceData.locations.hotels.byGeocode.get({
                latitude: latitude,
                longitude: longitude,
                radius: radius
            });

            return this.formatBasicHotels(response.data);
        } catch (error) {
            console.error('Błąd podczas wyszukiwania hoteli po lokalizacji:', error);
            throw new Error('Nie można wyszukać hoteli w tej lokalizacji.');
        }
    }

    /**
     * Formatuje dane hotelu z odpowiedzi API
     * @param {Array} hotels - Lista hoteli z API
     * @returns {Array} - Sformatowana lista hoteli
     */
    async formatHotelOffers(hotels) {
        return await Promise.all(hotels.map(async (hotel) => {
            const hotelData = hotel.hotel || hotel;
            const offer = hotel.offers ? hotel.offers[0] : null;

            // Pobierz szczegóły hotelu, w tym zdjęcia
            let hotelDetails = null;
            try {
                const detailsResponse = await amadeus.referenceData.locations.hotels.byHotels.get({
                    hotelIds: hotelData.hotelId
                });
                hotelDetails = detailsResponse.data[0];
            } catch (error) {
                console.warn(`Nie udało się pobrać szczegółów dla hotelu ${hotelData.hotelId}:`, error);
            }

            return {
                id: hotelData.hotelId,
                name: hotelData.name,
                rating: hotelData.rating || 0,
                city: hotelData.address?.cityName || 'N/A',
                address: this.formatAddress(hotelData.address),
                price: offer ? offer.price.total : null,
                currency: offer ? offer.price.currency : 'EUR',
                checkInDate: offer ? offer.checkInDate : null,
                checkOutDate: offer ? offer.checkOutDate : null,
                roomType: offer ? offer.room.type : null,
                amenities: hotelData.amenities || [],
                images: hotelDetails?.media?.map(m => m.uri) || [
                    // Fallback zdjęcia, jeśli API nie zwróci żadnych
                    'https://via.placeholder.com/800x600?text=Hotel+Image',
                    'https://via.placeholder.com/800x600?text=No+Image+Available'
                ],
                description: hotelDetails?.description?.text || null,
                coordinates: hotelDetails?.geoCode ? {
                    latitude: hotelDetails.geoCode.latitude,
                    longitude: hotelDetails.geoCode.longitude
                } : null
            };
        }));
    }

    /**
     * Formatuj podstawowe dane hoteli (bez cen)
     */
    formatBasicHotels(hotels) {
        return hotels.map(hotel => ({
            id: hotel.hotelId,
            name: hotel.name,
            city: hotel.address?.cityName || 'N/A',
            address: hotel.address ? 
                `${hotel.address.lines?.join(', ') || ''}, ${hotel.address.cityName || ''}` : 'N/A',
            price: null,
            currency: null,
            rating: hotel.rating || 0,
            coordinates: hotel.geoCode ? {
                latitude: hotel.geoCode.latitude,
                longitude: hotel.geoCode.longitude
            } : null,
            chainCode: hotel.chainCode,
            brandCode: hotel.brandCode
        }));
    }

    /**
     * Pobierz popularne destynacje
     */
    async getPopularDestinations() {
        try {
            // Spróbuj pobrać z alternatywnego API (zawsze działa)
            return await alternativeHotelService.getPopularDestinations();
        } catch (error) {
            // Fallback na statyczną listę
            const popularCities = [
                { code: 'PAR', name: 'Paryż', country: 'Francja' },
                { code: 'LON', name: 'Londyn', country: 'Wielka Brytania' },
                { code: 'NYC', name: 'Nowy Jork', country: 'USA' },
                { code: 'ROM', name: 'Rzym', country: 'Włochy' },
                { code: 'BCN', name: 'Barcelona', country: 'Hiszpania' },
                { code: 'BER', name: 'Berlin', country: 'Niemcy' },
                { code: 'WAW', name: 'Warszawa', country: 'Polska' },
                { code: 'KRK', name: 'Kraków', country: 'Polska' }
            ];
            
            return popularCities;
        }
    }

    /**
     * Konwertuje nazwę destynacji na kod miasta
     * @param {string} destination - Nazwa destynacji (np. "Paryż, Francja")
     * @returns {Promise<Object>} - Obiekt z kodem miasta
     */
    async getCityCode(destination) {
        try {
            // Najpierw sprawdź w mapie popularnych miast
            const popularCities = {
                // Polskie miasta
                'warszawa': 'WAW',
                'kraków': 'KRK',
                'krakow': 'KRK',
                'gdańsk': 'GDN',
                'gdansk': 'GDN',
                'wrocław': 'WRO',
                'wroclaw': 'WRO',
                'poznań': 'POZ',
                'poznan': 'POZ',
                'katowice': 'KTW',
                'szczecin': 'SZZ',
                'rzeszów': 'RZE',
                'rzeszow': 'RZE',
                'lublin': 'LUZ',
                'bydgoszcz': 'BZG',
                'łódź': 'LCJ',
                'lodz': 'LCJ',
                'kołobrzeg': 'OSP',
                'kolobrzeg': 'OSP',
                'zakopane': 'ZAK',
                'sopot': 'SOP',
                'międzyzdroje': 'MIE',
                'miedzyzdroje': 'MIE',
                'świnoujście': 'SWI',
                'swinoujscie': 'SWI',
                'karpacz': 'KRP',
                'szklarska poręba': 'SZK',
                'szklarska poreba': 'SZK',
                
                // Popularne europejskie miasta
                'paryż': 'PAR',
                'paris': 'PAR',
                'londyn': 'LON',
                'london': 'LON',
                'rzym': 'ROM',
                'rome': 'ROM',
                'madryt': 'MAD',
                'madrid': 'MAD',
                'barcelona': 'BCN',
                'amsterdam': 'AMS',
                'berlin': 'BER',
                'praga': 'PRG',
                'prague': 'PRG',
                'wiedeń': 'VIE',
                'vienna': 'VIE',
                'wien': 'VIE',
                'budapeszt': 'BUD',
                'budapest': 'BUD',
                'ateny': 'ATH',
                'athens': 'ATH',
                'lizbona': 'LIS',
                'lisbon': 'LIS',
                'kopenhaga': 'CPH',
                'copenhagen': 'CPH',
                'oslo': 'OSL',
                'sztokholm': 'STO',
                'stockholm': 'STO',
                'helsinki': 'HEL',
                'zurych': 'ZRH',
                'zurich': 'ZRH',
                'monachium': 'MUC',
                'munich': 'MUC',
                'dublin': 'DUB',
                
                // Popularne światowe miasta
                'nowy jork': 'NYC',
                'new york': 'NYC',
                'los angeles': 'LAX',
                'san francisco': 'SFO',
                'miami': 'MIA',
                'las vegas': 'LAS',
                'chicago': 'CHI',
                'tokio': 'TYO',
                'tokyo': 'TYO',
                'bangkok': 'BKK',
                'singapur': 'SIN',
                'singapore': 'SIN',
                'hong kong': 'HKG',
                'sydney': 'SYD',
                'dubaj': 'DXB',
                'dubai': 'DXB',
                'delhi': 'DEL',
                'rio de janeiro': 'RIO',
                'meksyk': 'MEX',
                'mexico city': 'MEX',
                'kapsztad': 'CPT',
                'cape town': 'CPT',
                'kair': 'CAI',
                'cairo': 'CAI',
                'stambuł': 'IST',
                'istanbul': 'IST'
            };
            
            // Sprawdź, czy nazwa miasta jest w naszej mapie
            const normalizedDestination = destination.toLowerCase().split(',')[0].trim();
            if (popularCities[normalizedDestination]) {
                return {
                    code: popularCities[normalizedDestination],
                    name: destination
                };
            }

            // Jeśli nie znaleziono w mapie, spróbuj przez API
            try {
                // Wywołaj API Amadeus do wyszukiwania lokalizacji
                const response = await amadeus.referenceData.locations.get({
                    keyword: destination,
                    subType: 'CITY,AIRPORT'
                });

                if (response.data && response.data.length > 0) {
                    // Zwróć pierwszy wynik
                    return {
                        code: response.data[0].iataCode,
                        name: response.data[0].name,
                        countryCode: response.data[0].address?.countryCode
                    };
                }
            } catch (apiError) {
                console.error('Błąd API Amadeus:', apiError);
                // Kontynuuj do fallbacku
            }
            
            // Jeśli nie znaleziono w mapie ani przez API, spróbuj odgadnąć kod
            // Weź pierwsze 3 litery miasta (typowa konwencja kodów IATA)
            if (normalizedDestination.length >= 3) {
                const guessedCode = normalizedDestination.substring(0, 3).toUpperCase();
                console.log(`Używam zgadniętego kodu miasta: ${guessedCode} dla ${destination}`);
                return {
                    code: guessedCode,
                    name: destination
                };
            }
            
            throw new Error('Nie znaleziono kodu miasta dla podanej destynacji');
        } catch (error) {
            console.error('Błąd podczas konwersji destynacji na kod miasta:', error);
            
            // Zwróć domyślny kod dla popularnych miast lub zgadnij na podstawie nazwy
            const normalizedDestination = destination.toLowerCase().split(',')[0].trim();
            if (normalizedDestination.length >= 3) {
                const guessedCode = normalizedDestination.substring(0, 3).toUpperCase();
                console.log(`Fallback: Używam zgadniętego kodu miasta: ${guessedCode} dla ${destination}`);
                return {
                    code: guessedCode,
                    name: destination
                };
            }
            
            // Ostateczny fallback - użyj WAW (Warszawa) jako domyślnego
            return {
                code: 'WAW',
                name: 'Warszawa, Polska'
            };
        }
    }

    /**
     * Pobiera nazwę miasta na podstawie kodu
     * @param {string} cityCode - Kod miasta (np. PAR, LCJ)
     * @returns {string} - Nazwa miasta
     */
    getCityNameFromCode(cityCode) {
        // Mapa kodów miast na nazwy
        const cityNames = {
            // Polskie miasta
            'WAW': 'Warszawa',
            'KRK': 'Kraków',
            'GDN': 'Gdańsk',
            'WRO': 'Wrocław',
            'POZ': 'Poznań',
            'KTW': 'Katowice',
            'SZZ': 'Szczecin',
            'RZE': 'Rzeszów',
            'LUZ': 'Lublin',
            'BZG': 'Bydgoszcz',
            'LCJ': 'Łódź',
            'OSP': 'Kołobrzeg',
            'ZAK': 'Zakopane',
            'SOP': 'Sopot',
            'MIE': 'Międzyzdroje',
            'SWI': 'Świnoujście',
            'KRP': 'Karpacz',
            'SZK': 'Szklarska Poręba',
            
            // Popularne europejskie miasta
            'PAR': 'Paryż',
            'LON': 'Londyn',
            'ROM': 'Rzym',
            'MAD': 'Madryt',
            'BCN': 'Barcelona',
            'AMS': 'Amsterdam',
            'BER': 'Berlin',
            'PRG': 'Praga',
            'VIE': 'Wiedeń',
            'BUD': 'Budapeszt',
            'ATH': 'Ateny',
            'LIS': 'Lizbona',
            'CPH': 'Kopenhaga',
            'OSL': 'Oslo',
            'STO': 'Sztokholm',
            'HEL': 'Helsinki',
            'ZRH': 'Zurych',
            'MUC': 'Monachium',
            'DUB': 'Dublin',
            
            // Popularne światowe miasta
            'NYC': 'Nowy Jork',
            'LAX': 'Los Angeles',
            'SFO': 'San Francisco',
            'MIA': 'Miami',
            'LAS': 'Las Vegas',
            'CHI': 'Chicago',
            'TYO': 'Tokio',
            'BKK': 'Bangkok',
            'SIN': 'Singapur',
            'HKG': 'Hong Kong',
            'SYD': 'Sydney',
            'DXB': 'Dubaj',
            'DEL': 'Delhi',
            'RIO': 'Rio de Janeiro',
            'MEX': 'Meksyk',
            'CPT': 'Kapsztad',
            'CAI': 'Kair',
            'IST': 'Stambuł'
        };
        
        return cityNames[cityCode] || null;
    }

    /**
     * Generuje przykładowe dane hoteli dla podanego miasta
     * @param {string} cityCode - Kod miasta
     * @param {string} checkInDate - Data zameldowania
     * @param {string} checkOutDate - Data wymeldowania
     * @returns {Array} - Lista przykładowych hoteli
     */
    getMockHotels(cityCode, checkInDate, checkOutDate) {
        // Mapa nazw miast dla popularnych kodów
        const cityNames = {
            // Polskie miasta
            'WAW': 'Warszawa',
            'KRK': 'Kraków',
            'GDN': 'Gdańsk',
            'WRO': 'Wrocław',
            'POZ': 'Poznań',
            'KTW': 'Katowice',
            'SZZ': 'Szczecin',
            'RZE': 'Rzeszów',
            'LUZ': 'Lublin',
            'BZG': 'Bydgoszcz',
            'LCJ': 'Łódź',
            'OSP': 'Kołobrzeg',
            'ZAK': 'Zakopane',
            'SOP': 'Sopot',
            'MIE': 'Międzyzdroje',
            'SWI': 'Świnoujście',
            'KRP': 'Karpacz',
            'SZK': 'Szklarska Poręba',
            
            // Popularne europejskie miasta
            'PAR': 'Paryż',
            'LON': 'Londyn',
            'ROM': 'Rzym',
            'MAD': 'Madryt',
            'BCN': 'Barcelona',
            'AMS': 'Amsterdam',
            'BER': 'Berlin',
            'PRG': 'Praga',
            'VIE': 'Wiedeń',
            'BUD': 'Budapeszt',
            'ATH': 'Ateny',
            'LIS': 'Lizbona',
            'CPH': 'Kopenhaga',
            'OSL': 'Oslo',
            'STO': 'Sztokholm',
            'HEL': 'Helsinki',
            'ZRH': 'Zurych',
            'MUC': 'Monachium',
            'DUB': 'Dublin',
            
            // Popularne światowe miasta
            'NYC': 'Nowy Jork',
            'LAX': 'Los Angeles',
            'SFO': 'San Francisco',
            'MIA': 'Miami',
            'LAS': 'Las Vegas',
            'CHI': 'Chicago',
            'TYO': 'Tokio',
            'BKK': 'Bangkok',
            'SIN': 'Singapur',
            'HKG': 'Hong Kong',
            'SYD': 'Sydney',
            'DXB': 'Dubaj',
            'DEL': 'Delhi',
            'RIO': 'Rio de Janeiro',
            'MEX': 'Meksyk',
            'CPT': 'Kapsztad',
            'CAI': 'Kair',
            'IST': 'Stambuł'
        };
        
        // Domyślna nazwa miasta
        let cityName = cityNames[cityCode] || `Miasto (${cityCode})`;
        
        // Przykładowe nazwy hoteli dla różnych kategorii
        const hotelPrefixes = [
            'Grand Hotel', 'Hotel', 'Apartamenty', 'Pensjonat', 'Rezydencja',
            'Royal', 'Boutique Hotel', 'Palace', 'Resort & Spa', 'Luksusowy Hotel'
        ];
        
        const hotelSuffixes = [
            'Plaza', 'Centrum', 'Old Town', 'Residence', 'Panorama',
            'Deluxe', 'Premium', 'Executive', 'Exclusive', 'Prestige'
        ];
        
        // Generuj nazwy hoteli dla danego miasta
        const hotelNames = [];
        for (let i = 0; i < 5; i++) {
            hotelNames.push(`${hotelPrefixes[i % hotelPrefixes.length]} ${cityName}`);
        }
        for (let i = 0; i < 5; i++) {
            hotelNames.push(`${cityName} ${hotelSuffixes[i % hotelSuffixes.length]}`);
        }
        
        // Przykładowe adresy dla różnych typów miast
        let streets;
        if (Object.values(cityNames).slice(0, 18).includes(cityName)) {
            // Polskie ulice
            streets = [
                'ul. Marszałkowska', 'ul. Piotrkowska', 'ul. Floriańska', 
                'ul. Długa', 'Aleje Jerozolimskie', 'ul. Świdnicka',
                'ul. Bohaterów Monte Cassino', 'ul. Krupówki', 'ul. Szeroka',
                'Plac Zamkowy', 'ul. Świętojańska', 'ul. Wrocławska'
            ];
        } else {
            // Międzynarodowe ulice
            streets = [
                'Main Street', 'Broadway', 'High Street', 'Avenue des Champs-Élysées',
                'Via del Corso', 'Gran Vía', 'Kurfürstendamm', 'Oxford Street',
                'Fifth Avenue', 'Orchard Road', 'Las Ramblas', 'Ginza'
            ];
        }
        
        // Generuj adresy
        const addresses = streets.map(street => `${street} ${Math.floor(Math.random() * 100) + 1}, ${cityName}`);
        
        // ... existing code ...
    }
}

module.exports = new AmadeusService();