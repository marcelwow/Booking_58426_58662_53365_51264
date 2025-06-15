const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const AmadeusService = require('../services/amadeusService');
const currencyService = require('../services/currencyService');

// Inicjalizacja serwisu Amadeus
const amadeusService = new AmadeusService();

// Funkcja przeliczania walut do użycia w szablonach
function getExchangeRate(fromCurrency, toCurrency) {
    // Stałe kursy wymiany walut (w rzeczywistej aplikacji powinny być pobierane z API)
    const rates = {
        'EUR': 4.32,
        'USD': 3.95,
        'GBP': 5.05,
        'PLN': 1.00
    };
    
    // Domyślny kurs wymiany, jeśli waluta nie została znaleziona
    const defaultRate = 4.0;
    return rates[fromCurrency] || defaultRate;
}

// Lista hoteli z bazy danych (lokalnych)
router.get('/', async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.render('list', {
            title: 'Lista hoteli',
            hotels: hotels
        });
    } catch (err) {
        console.error("Błąd serwera:", err);
        res.status(500).send('Błąd serwera');
    }
});

// Formularz wyszukiwania hoteli
router.get('/search', async (req, res) => {
    try {
        console.log("Otrzymane parametry wyszukiwania:", req.query);
        const { city, adults = 1, checkInDate, checkOutDate } = req.query;
        
        // Jeśli nie ma parametrów wyszukiwania, pokaż formularz
        if (Object.keys(req.query).length === 0 || !city) {
            return res.render('search', { 
                title: 'Wyszukaj hotele',
                message: 'Wyszukaj hotele w wybranym mieście',
                error: city === '' ? 'Proszę podać miasto docelowe.' : null
            });
        }

        console.log(`Wyszukiwanie hoteli w mieście: ${city}`);
        
        // Konwertuj nazwę miasta na kod IATA
        const cityData = await amadeusService.getCityCode(city);
        const cityCode = cityData ? cityData.code : city.substring(0, 3).toUpperCase();
        
        // Pobierz hotele z API Amadeus
        const hotels = await amadeusService.searchHotels(
            cityCode,
            parseInt(adults) || 1,
            checkInDate,
            checkOutDate
        );
        
        console.log(`Znaleziono ${hotels.length} hoteli w mieście: ${city}`);
        
        res.render('search-results', { 
            title: `Hotele w ${city}`,
            hotels: hotels,
            searchParams: { city, adults, checkInDate, checkOutDate },
            error: null,
            getExchangeRate: getExchangeRate
        });
    } catch (error) {
        console.error('Błąd wyszukiwania hoteli:', error);
        res.render('search-results', { 
            title: 'Wyniki wyszukiwania',
            hotels: [],
            searchParams: req.query,
            error: 'Wystąpił błąd podczas wyszukiwania hoteli. Proszę spróbować ponownie.'
        });
    }
});

// Wyszukiwanie hoteli przez API
router.post('/search', async (req, res) => {
    try {
        const { destination, cityCode, checkInDate, checkOutDate, adults } = req.body;
        
        let searchCityCode = null;
        let searchDestination = null;
        
        // Sprawdź, czy użytkownik podał destynację (nowe pole) lub cityCode (stare pole)
        if (destination) {
            searchDestination = destination.trim();

            // Jeśli destynacja jest trzyliterowa i składa się tylko z liter, traktuj jak kod IATA
            if (destination.length === 3 && /^[A-Za-z]{3}$/.test(destination)) {
                searchCityCode = destination.toUpperCase();
                // Znajdź nazwę miasta dla tego kodu
                searchDestination = amadeusService.getCityNameFromCode(searchCityCode) || searchDestination;
            } else {
                // Konwertuj nazwę destynacji na kod miasta
                try {
                    const cityData = await amadeusService.getCityCode(destination);
                    if (cityData && cityData.code) {
                        searchCityCode = cityData.code;
                        console.log(`Znaleziono kod miasta: ${searchCityCode} dla destynacji: ${destination}`);
                    }
                } catch (error) {
                    console.error('Błąd podczas konwersji destynacji na kod miasta:', error);
                    // Nie przerywamy, kontynuujemy z wyszukiwaniem alternatywnym
                }
            }
        } else if (cityCode) {
            // Zachowanie kompatybilności wstecznej
            searchCityCode = cityCode.toUpperCase();
            // Znajdź nazwę miasta dla tego kodu
            searchDestination = amadeusService.getCityNameFromCode(searchCityCode) || cityCode;
        }
        
        if (!searchCityCode && !searchDestination) {
            return res.render('search', {
                title: 'Wyszukaj hotele',
                message: 'Proszę podać miasto lub miejsce podróży',
                error: 'Destynacja jest wymagana'
            });
        }

        // Jeśli nadal nie mamy kodu miasta, użyj pierwszych 3 liter destynacji
        if (!searchCityCode && searchDestination) {
            // Utwórz kod IATA z pierwszych trzech liter destynacji
            searchCityCode = searchDestination.substring(0, 3).toUpperCase();
            console.log(`Używam pierwszych 3 liter destynacji jako kod: ${searchCityCode}`);
        }

        console.log(`Wyszukiwanie hoteli: ${searchDestination || searchCityCode}, ${checkInDate} - ${checkOutDate}, ${adults} osób`);
        
        const hotels = await amadeusService.searchHotels(
            searchCityCode.toUpperCase(), 
            parseInt(adults) || 1, 
            checkInDate, 
            checkOutDate
        );

        // Sprawdź czy mamy wyniki
        if (!hotels || hotels.length === 0) {
            return res.render('search-results', {
                title: `Brak hoteli w ${searchDestination || searchCityCode}`,
                hotels: [],
                searchParams: {
                    cityCode: searchCityCode,
                    destination: searchDestination || searchCityCode,
                    checkInDate,
                    checkOutDate,
                    adults: adults || '1'
                },
                noResults: true,
                message: 'Nie znaleziono hoteli dla podanych kryteriów. Spróbuj zmienić daty lub destynację.',
                getExchangeRate: getExchangeRate
            });
        }

        res.render('search-results', {
            title: `Hotele w ${searchDestination || searchCityCode}`,
            hotels: hotels,
            searchParams: {
                cityCode: searchCityCode,
                destination: searchDestination || searchCityCode,
                checkInDate,
                checkOutDate,
                adults: adults || '1'
            },
            noResults: false,
            getExchangeRate: getExchangeRate
        });

    } catch (error) {
        console.error('Błąd podczas wyszukiwania hoteli:', error);
        res.render('search', {
            title: 'Wyszukaj hotele',
            message: 'Błąd podczas wyszukiwania',
            error: 'Wystąpił problem z wyszukiwaniem. Spróbuj ponownie później.'
        });
    }
});

// Wyszukiwanie hoteli po lokalizacji (GPS)
router.post('/search-by-location', async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ 
                error: 'Szerokość i długość geograficzna są wymagane' 
            });
        }

        const hotels = await amadeusService.searchHotelsByLocation(
            parseFloat(latitude),
            parseFloat(longitude),
            parseInt(radius) || 20
        );
        
        res.json({
            success: true,
            hotels: hotels,
            searchParams: { latitude, longitude, radius }
        });

    } catch (error) {
        console.error('Błąd podczas wyszukiwania hoteli po lokalizacji:', error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// API endpoint - popularne destynacje
router.get('/api/destinations', async (req, res) => {
    try {
        const destinations = await amadeusService.getPopularDestinations();
        res.json(destinations);
    } catch (error) {
        console.error('Błąd podczas pobierania destynacji:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint - wyszukiwanie hoteli (JSON response)
router.get('/api/search', async (req, res) => {
    try {
        const { cityCode, checkInDate, checkOutDate, adults } = req.query;
        
        if (!cityCode) {
            return res.status(400).json({ error: 'Kod miasta jest wymagany' });
        }

        const hotels = await amadeusService.searchHotels(
            cityCode.toUpperCase(), 
            parseInt(adults) || 1, 
            checkInDate, 
            checkOutDate
        );
        
        res.json({
            success: true,
            hotels: hotels,
            searchParams: { 
                cityCode, 
                checkInDate, 
                checkOutDate, 
                adults: adults || '1' 
            }
        });

    } catch (error) {
        console.error('Błąd API wyszukiwania hoteli:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rezerwacja hotelu
router.post('/book', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Generuj unikalny ID rezerwacji
        const bookingId = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Symulacja zapisu rezerwacji do bazy danych
        console.log('Nowa rezerwacja:', { bookingId, ...bookingData });
        
        // Zwróć potwierdzenie
        res.json({ 
            success: true, 
            message: 'Rezerwacja została przyjęta',
            bookingDetails: {
                bookingId,
                ...bookingData
            }
        });
    } catch (error) {
        console.error('Błąd rezerwacji:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Wystąpił błąd podczas przetwarzania rezerwacji'
        });
    }
});

// Szczegóły hotelu
router.get('/:id', async (req, res) => {
    try {
        const hotelId = req.params.id;
        
        // Pobierz szczegóły hotelu z API Amadeus zamiast z alternatywnego serwisu
        // Implementacja tymczasowa - w rzeczywistości powinniśmy użyć API Amadeus
        // do pobrania szczegółów hotelu po ID
        const hotels = await amadeusService.getMockHotels(hotelId.substring(0, 3), null, null);
        const hotel = hotels.find(h => h.id === hotelId) || hotels[0];
        
        if (!hotel) {
            return res.status(404).render('error', {
                title: 'Hotel nie znaleziony',
                message: 'Hotel nie został znaleziony',
                error: { status: 404 }
            });
        }
        
        res.render('hotel-details', {
            title: hotel.name,
            hotel,
            getExchangeRate: getExchangeRate
        });
    } catch (error) {
        console.error('Błąd pobierania szczegółów hotelu:', error);
        res.status(500).render('error', {
            title: 'Błąd serwera',
            message: 'Wystąpił błąd podczas pobierania szczegółów hotelu',
            error: { status: 500 }
        });
    }
});

module.exports = router;
