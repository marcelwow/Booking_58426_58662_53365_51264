const Amadeus = require('amadeus');
const config = require('../src/config');
// Usuwamy import alternatywnego serwisu
// const alternativeHotelService = require('./alternativeHotelService');

// Dodajemy debugowanie
console.log('Config values:');
console.log('AMADEUS_CLIENT_ID:', config.amadeus.clientId);
console.log('AMADEUS_CLIENT_SECRET:', config.amadeus.clientSecret);

class AmadeusService {
    constructor() {
        console.log('Inicjalizacja AmadeusService z kluczami:', {
            clientId: config.amadeus.clientId,
            clientSecret: config.amadeus.clientSecret
        });

        if (!config.amadeus.clientId || !config.amadeus.clientSecret) {
            throw new Error('Brak wymaganych kluczy API Amadeus');
        }

        try {
            this.client = new Amadeus({
                clientId: config.amadeus.clientId,
                clientSecret: config.amadeus.clientSecret,
                hostname: 'test.api.amadeus.com'
            });

            // Sprawdź czy klient został poprawnie zainicjalizowany
            if (!this.client) {
                throw new Error('Nie udało się zainicjalizować klienta Amadeus');
            }

            console.log('Klient Amadeus został poprawnie zainicjalizowany');
        } catch (error) {
            console.error('Błąd podczas inicjalizacji klienta Amadeus:', error);
            throw error;
        }
    }

    // Metoda testowa do sprawdzenia połączenia
    async testConnection() {
        try {
            console.log('Testowanie połączenia z API Amadeus...');
            const response = await this.client.referenceData.locations.get({
                keyword: 'PAR',
                subType: 'CITY'
            });
            console.log('Test połączenia udany:', response.data);
            return true;
        } catch (error) {
            console.error('Błąd testu połączenia:', error);
            if (error.response) {
                console.error('Szczegóły błędu:', {
                    status: error.response.statusCode,
                    headers: error.response.headers,
                    body: error.response.body
                });
            }
            return false;
        }
    }

    /**
     * Wyszukuje hotele w podanym mieście
     * @param {string} cityCode - Kod miasta (np. PAR dla Paryża)
     * @param {number} adults - Liczba dorosłych
     * @param {string} checkInDate - Data zameldowania (YYYY-MM-DD)
     * @param {string} checkOutDate - Data wymeldowania (YYYY-MM-DD)
     * @returns {Promise<Array>} - Lista hoteli
     */
    async searchHotels(cityCode, checkInDate, checkOutDate, adults) {
        try {
            // Najpierw przetestuj połączenie
            const isConnected = await this.testConnection();
            if (!isConnected) {
                throw new Error('Nie można połączyć się z API Amadeus');
            }

            console.log('Wyszukiwanie hoteli z parametrami:', {
                cityCode,
                checkInDate,
                checkOutDate,
                adults
            });

            // Najpierw pobieramy listę hoteli w mieście
            const hotelsResponse = await this.client.referenceData.locations.hotels.byCity.get({
                cityCode: cityCode
            });

            if (!hotelsResponse.data || hotelsResponse.data.length === 0) {
                return [];
            }

            const hotelIds = hotelsResponse.data.map(hotel => hotel.hotelId).join(',');
            
            // Następnie pobieramy oferty dla znalezionych hoteli
            const availabilityResponse = await this.client.shopping.hotelOffers.get({
                hotelIds: hotelIds,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                adults: adults,
                roomQuantity: 1,
                currency: 'EUR'
            });

            return availabilityResponse.data.map(offer => ({
                id: offer.hotel.hotelId,
                name: offer.hotel.name,
                rating: offer.hotel.rating,
                address: {
                    street: offer.hotel.address.lines[0],
                    city: offer.hotel.address.cityName,
                    country: offer.hotel.address.countryCode
                },
                price: offer.offers[0].price.total,
                currency: offer.offers[0].price.currency,
                amenities: offer.hotel.amenities || [],
                images: offer.hotel.media ? offer.hotel.media.map(m => m.uri) : []
            }));
        } catch (error) {
            console.error('Błąd API Amadeus:', error);
            throw error;
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
            const response = await this.client.referenceData.locations.hotels.byGeocode.get({
                latitude: latitude,
                longitude: longitude,
                radius: radius
            });

            if (!response.data || response.data.length === 0) {
                return [];
            }

            return response.data.map(hotelData => ({
                id: hotelData.hotelId,
                name: hotelData.name,
                rating: hotelData.rating,
                address: {
                    street: hotelData.address.lines[0],
                    city: hotelData.address.cityName,
                    country: hotelData.address.countryCode
                },
                distance: hotelData.distance.value,
                distanceUnit: hotelData.distance.unit
            }));
        } catch (error) {
            console.error('Błąd podczas wyszukiwania hoteli po lokalizacji:', error);
            throw error;
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
                const detailsResponse = await this.client.referenceData.locations.hotels.byHotels.get({
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
            // Zamiast używać alternatywnego API, zwracamy statyczną listę
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
     * Konwertuje nazwę miasta na kod IATA
     * @param {string} cityName - Nazwa miasta
     * @returns {Promise<Object>} - Obiekt z kodem miasta
     */
    async getCityCode(cityName) {
        try {
            const response = await this.client.referenceData.locations.get({
                keyword: cityName,
                subType: 'CITY'
            });

            if (response.data && response.data.length > 0) {
                return {
                    code: response.data[0].iataCode,
                    name: response.data[0].name
                };
            }
            return null;
        } catch (error) {
            console.error('Błąd podczas pobierania kodu miasta:', error);
            throw error;
        }
    }
    
    /**
     * Konwertuje kod IATA miasta na nazwę
     * @param {string} cityCode - Kod IATA miasta
     * @returns {string|null} - Nazwa miasta lub null
     */
    getCityNameFromCode(cityCode) {
        // Prosta mapa kodów IATA do nazw miast
        const cityMap = {
            'WAW': 'Warszawa',
            'KRK': 'Kraków',
            'GDN': 'Gdańsk',
            'WRO': 'Wrocław',
            'POZ': 'Poznań',
            'PAR': 'Paryż',
            'LON': 'Londyn',
            'NYC': 'Nowy Jork',
            'ROM': 'Rzym',
            'BER': 'Berlin'
        };
        return cityMap[cityCode] || cityCode;
    }

    /**
     * Generuje przykładowe dane hoteli dla podanego miasta
     * @param {string} cityCode - Kod miasta
     * @param {string} checkInDate - Data zameldowania
     * @param {string} checkOutDate - Data wymeldowania
     * @param {number} adults - Liczba dorosłych
     * @returns {Array} - Lista przykładowych hoteli
     */
    getMockHotels(cityCode, checkInDate, checkOutDate, adults = 1) {
        console.log(`Generowanie przykładowych hoteli dla ${cityCode}`);
        
        // Pobierz nazwę miasta na podstawie kodu
        const cityName = this.getCityNameFromCode(cityCode) || 'Nieznane miasto';
        
        // Generuj przykładowe nazwy ulic dla danego miasta
        const streets = [
            'Główna', 'Warszawska', 'Krakowska', 'Mickiewicza', 'Słowackiego',
            'Kościuszki', 'Piłsudskiego', 'Sienkiewicza', 'Kolejowa', '3 Maja'
        ];
        
        // Generuj adresy
        const addresses = streets.map(street => `${street} ${Math.floor(Math.random() * 100) + 1}, ${cityName}`);
        
        // Generuj przykładowe hotele
        const mockHotels = [];
        
        for (let i = 0; i < 10; i++) {
            // Generuj unikalny ID hotelu
            const hotelId = `${cityCode}-${i + 1}`.padStart(6, '0');
            
            // Wybierz losowy adres
            const address = addresses[i % addresses.length];
            
            // Generuj losową cenę w zależności od miasta
            let basePrice;
            if (['PAR', 'LON', 'NYC', 'ROM', 'BER'].includes(cityCode)) {
                // Droższe miasta
                basePrice = Math.floor(Math.random() * 300) + 200;
            } else if (['WAW', 'KRK', 'POZ'].includes(cityCode)) {
                // Średnio drogie miasta
                basePrice = Math.floor(Math.random() * 200) + 150;
            } else {
                // Tańsze miasta
                basePrice = Math.floor(Math.random() * 150) + 100;
            }
            
            // Dodaj mnożnik w zależności od liczby osób
            const price = basePrice * (adults || 1);
            
            // Generuj współrzędne geograficzne na podstawie miasta
            let baseLat, baseLng;
            switch (cityCode) {
                case 'WAW':
                    baseLat = 52.2297; baseLng = 21.0122; break;
                case 'KRK':
                    baseLat = 50.0647; baseLng = 19.9450; break;
                case 'GDN':
                    baseLat = 54.3520; baseLng = 18.6466; break;
                case 'WRO':
                    baseLat = 51.1079; baseLng = 17.0385; break;
                case 'POZ':
                    baseLat = 52.4064; baseLng = 16.9252; break;
                case 'PAR':
                    baseLat = 48.8566; baseLng = 2.3522; break;
                case 'LON':
                    baseLat = 51.5074; baseLng = -0.1278; break;
                case 'BER':
                    baseLat = 52.5200; baseLng = 13.4050; break;
                case 'ROM':
                    baseLat = 41.9028; baseLng = 12.4964; break;
                case 'NYC':
                    baseLat = 40.7128; baseLng = -74.0060; break;
                default:
                    baseLat = 50.0000; baseLng = 20.0000;
            }
            
            // Dodaj małe losowe odchylenie do współrzędnych
            const latitude = baseLat + (Math.random() - 0.5) * 0.05;
            const longitude = baseLng + (Math.random() - 0.5) * 0.05;
            
            // Generuj losowe udogodnienia
            const allAmenities = [
                'Bezpłatne Wi-Fi', 'Klimatyzacja', 'Basen', 'Siłownia', 'Spa',
                'Restauracja', 'Bar', 'Parking', 'Obsługa pokoju', 'Pralnia',
                'Centrum biznesowe', 'Sala konferencyjna', 'Zwierzęta dozwolone',
                'Transfer z/na lotnisko', 'Śniadanie w cenie'
            ];
            
            // Wybierz losową liczbę udogodnień (od 3 do 10)
            const numAmenities = Math.floor(Math.random() * 8) + 3;
            const shuffledAmenities = [...allAmenities].sort(() => 0.5 - Math.random());
            const amenities = shuffledAmenities.slice(0, numAmenities);
            
            // Generuj losową ocenę (od 3.0 do 5.0)
            const rating = (Math.random() * 2 + 3).toFixed(1);
            
            // Generuj losową liczbę gwiazdek (od 2 do 5)
            const stars = Math.floor(Math.random() * 4) + 2;
            
            // Generuj losową liczbę opinii (od 10 do 500)
            const reviewCount = Math.floor(Math.random() * 490) + 10;
            
            // Wybierz losowe zdjęcie z Unsplash
            const imageCategories = ['hotel', 'room', 'bedroom', 'interior', 'architecture'];
            const imageCategory = imageCategories[Math.floor(Math.random() * imageCategories.length)];
            const imageId = Math.floor(Math.random() * 1000);
            const images = [
                `https://source.unsplash.com/random/800x600?${imageCategory}&sig=${imageId}`,
                `https://source.unsplash.com/random/800x600?${imageCategory}&sig=${imageId + 1}`,
                `https://source.unsplash.com/random/800x600?${imageCategory}&sig=${imageId + 2}`
            ];
            
            // Dodaj hotel do listy
            mockHotels.push({
                id: hotelId,
                name: `Hotel ${cityName} ${i + 1}`,
                city: cityName,
                address: address,
                description: `Komfortowy hotel położony w centrum miasta ${cityName}. Oferuje przestronne pokoje, doskonałą obsługę i wiele udogodnień dla gości biznesowych i turystów.`,
                price: price,
                currency: 'PLN',
                rating: parseFloat(rating),
                coordinates: {
                    latitude: latitude,
                    longitude: longitude
                },
                images: images,
                amenities: amenities,
                stars: stars,
                reviewScore: parseFloat(rating),
                reviewCount: reviewCount
            });
        }
        
        return mockHotels;
    }
}

// Eksportujemy klasę zamiast instancji
module.exports = AmadeusService;