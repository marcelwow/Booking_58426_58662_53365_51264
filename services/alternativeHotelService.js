// Alternatywny service hotelowy (gdy Amadeus nie działa)
const https = require('https');

class AlternativeHotelService {
    
    /**
     * Wyszukaj hotele - alternatywny sposób z darmowymi danymi
     */
    async searchHotels(cityCode, adults = 1, checkInDate, checkOutDate) {
        try {
            console.log(`🔄 Używam alternatywnego API dla: ${cityCode}`);
            
            // Symulacja prawdziwych hoteli na podstawie kodu miasta
            const hotelData = this.getMockHotelData(cityCode, checkInDate, checkOutDate, adults);
            
            return hotelData;
            
        } catch (error) {
            console.error('Błąd alternatywnego API:', error);
            return [];
        }
    }

    /**
     * Generuj realistyczne dane hoteli na podstawie miasta
     */
    getMockHotelData(cityCode, checkInDate, checkOutDate, adults) {
        const cityHotels = {
            'PAR': [
                {
                    id: 'hotel_par_1',
                    name: 'Hotel des Champs-Élysées',
                    city: 'Paryż',
                    address: '12 Rue de Rivoli, 75001 Paris, France',
                    price: 180,
                    currency: 'EUR',
                    rating: 4,
                    amenities: ['WiFi', 'Śniadanie', 'Klimatyzacja', 'Reception 24h'],
                    description: 'Elegancki hotel w centrum Paryża, blisko Luwru i Wieży Eiffla.',
                    images: [
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
                        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
                    ],
                    coordinates: { latitude: 48.8566, longitude: 2.3522 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Standard Room'
                },
                {
                    id: 'hotel_par_2', 
                    name: 'Le Grand Hotel de Paris',
                    city: 'Paryż',
                    address: '8 Avenue de l\'Opéra, 75009 Paris, France',
                    price: 220,
                    currency: 'EUR',
                    rating: 5,
                    amenities: ['WiFi', 'Spa', 'Restaurant', 'Parking', 'Gym'],
                    description: 'Luksusowy hotel z widokiem na Operę Paryską.',
                    images: [
                        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
                        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
                    ],
                    coordinates: { latitude: 48.8699, longitude: 2.3305 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Deluxe Room'
                }
            ],
            'LON': [
                {
                    id: 'hotel_lon_1',
                    name: 'The London Bridge Hotel',
                    city: 'Londyn',
                    address: '8-18 London Bridge St, London SE1 9SG, UK',
                    price: 160,
                    currency: 'GBP',
                    rating: 4,
                    amenities: ['WiFi', 'Śniadanie', 'Business Center', 'Concierge'],
                    description: 'Stylowy hotel w sercu Londynu, blisko Tower Bridge.',
                    images: [
                        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
                        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
                    ],
                    coordinates: { latitude: 51.5074, longitude: -0.0878 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Classic Room'
                },
                {
                    id: 'hotel_lon_2',
                    name: 'Westminster Palace Hotel',
                    city: 'Londyn',
                    address: '2 Victoria Street, Westminster, London SW1H 0ND, UK',
                    price: 220,
                    currency: 'GBP',
                    rating: 5,
                    amenities: ['WiFi', 'Spa', 'Fine Dining', 'Butler Service', 'Valet'],
                    description: 'Luksusowy hotel w Westminster z widokiem na Big Ben.',
                    images: [
                        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
                    ],
                    coordinates: { latitude: 51.4994, longitude: -0.1319 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Premier Room'
                },
                {
                    id: 'hotel_lon_3',
                    name: 'Camden Budget Inn',
                    city: 'Londyn',
                    address: '45 Camden High Street, London NW1 7JH, UK',
                    price: 90,
                    currency: 'GBP',
                    rating: 3,
                    amenities: ['WiFi', 'Shared Kitchen', 'Laundry'],
                    description: 'Przystępny hotel w modnej dzielnicy Camden.',
                    images: [
                        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
                    ],
                    coordinates: { latitude: 51.5390, longitude: -0.1426 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Standard Room'
                }
            ],
            'WAW': [
                {
                    id: 'hotel_waw_1',
                    name: 'Hotel Warszawa Palace',
                    city: 'Warszawa',
                    address: 'ul. Krakowskie Przedmieście 1, 00-001 Warszawa',
                    price: 120,
                    currency: 'PLN',
                    rating: 4,
                    amenities: ['WiFi', 'Śniadanie', 'Klimatyzacja', 'Parking'],
                    description: 'Elegancki hotel w centrum Warszawy, przy Krakowskim Przedmieściu.',
                    images: [
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
                    ],
                    coordinates: { latitude: 52.2297, longitude: 21.0122 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Standard Room'
                },
                {
                    id: 'hotel_waw_2',
                    name: 'Warsaw Grand Hotel',
                    city: 'Warszawa',
                    address: 'ul. Nowy Świat 15, 00-029 Warszawa',
                    price: 180,
                    currency: 'PLN',
                    rating: 5,
                    amenities: ['WiFi', 'Spa', 'Restaurant', 'Gym', 'Valet Parking'],
                    description: 'Luksusowy hotel w centrum Warszawy z widokiem na Pałac Kultury.',
                    images: [
                        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
                        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
                    ],
                    coordinates: { latitude: 52.2319, longitude: 21.0227 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Deluxe Room'
                },
                {
                    id: 'hotel_waw_3',
                    name: 'Budget Hotel Warszawa',
                    city: 'Warszawa',
                    address: 'ul. Marszałkowska 55, 00-676 Warszawa',
                    price: 80,
                    currency: 'PLN',
                    rating: 3,
                    amenities: ['WiFi', 'Reception 24h', 'Luggage Storage'],
                    description: 'Przystępny cenowo hotel dla podróżnych biznesowych.',
                    images: [
                        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
                    ],
                    coordinates: { latitude: 52.2275, longitude: 21.0081 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Economy Room'
                },
                {
                    id: 'hotel_waw_4',
                    name: 'Hotel Wilanów Resort',
                    city: 'Warszawa',
                    address: 'ul. Wilanowska 150, 02-765 Warszawa',
                    price: 200,
                    currency: 'PLN',
                    rating: 4,
                    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Conference Room'],
                    description: 'Elegancki hotel-resort na obrzeżach Warszawy, blisko Pałacu w Wilanowie.',
                    images: [
                        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
                    ],
                    coordinates: { latitude: 52.1653, longitude: 21.0900 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'Resort Room'
                }
            ],
            'NYC': [
                {
                    id: 'hotel_nyc_1',
                    name: 'Manhattan Grand Hotel',
                    city: 'Nowy Jork',
                    address: '123 5th Avenue, New York, NY 10010',
                    price: 280,
                    currency: 'USD',
                    rating: 4,
                    amenities: ['WiFi', 'Fitness Center', 'Room Service', 'Valet Parking'],
                    description: 'Luksusowy hotel na Manhattanie z widokiem na Central Park.',
                    images: [
                        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
                    ],
                    coordinates: { latitude: 40.7589, longitude: -73.9851 },
                    checkInDate,
                    checkOutDate,
                    roomType: 'City View Room'
                }
            ]
        };

        const hotels = cityHotels[cityCode.toUpperCase()] || [];
        
        // Dodaj zmienność cen na podstawie dat i liczby osób
        return hotels.map(hotel => ({
            ...hotel,
            price: this.adjustPrice(hotel.price, adults, checkInDate, checkOutDate)
        }));
    }

    /**
     * Dostosuj cenę na podstawie parametrów
     */
    adjustPrice(basePrice, adults, checkInDate, checkOutDate) {
        let adjustedPrice = basePrice;
        
        // Więcej osób = wyższa cena
        if (adults > 2) {
            adjustedPrice += (adults - 2) * 20;
        }
        
        // Weekend = wyższa cena
        if (checkInDate) {
            const date = new Date(checkInDate);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 5 || dayOfWeek === 6) { // Piątek lub sobota
                adjustedPrice *= 1.2;
            }
        }
        
        return Math.round(adjustedPrice);
    }

    /**
     * Pobierz szczegóły hotelu
     */
    async getHotelDetails(hotelId) {
        // Symulacja szczegółów na podstawie ID
        const mockDetails = {
            id: hotelId,
            name: 'Mock Hotel Details',
            city: 'Test City',
            address: '123 Test Street',
            price: 150,
            currency: 'EUR',
            rating: 4,
            amenities: ['WiFi', 'Parking', 'Breakfast'],
            description: 'Szczegółowe informacje o hotelu będą dostępne po pełnej integracji API.',
            images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
            coordinates: { latitude: 50.0, longitude: 20.0 }
        };
        
        return mockDetails;
    }

    /**
     * Pobierz popularne destynacje
     */
    async getPopularDestinations() {
        return [
            { code: 'PAR', name: 'Paryż', country: 'Francja' },
            { code: 'LON', name: 'Londyn', country: 'Wielka Brytania' },
            { code: 'NYC', name: 'Nowy Jork', country: 'USA' },
            { code: 'WAW', name: 'Warszawa', country: 'Polska' },
            { code: 'ROM', name: 'Rzym', country: 'Włochy' },
            { code: 'BCN', name: 'Barcelona', country: 'Hiszpania' }
        ];
    }
}

module.exports = new AlternativeHotelService(); 