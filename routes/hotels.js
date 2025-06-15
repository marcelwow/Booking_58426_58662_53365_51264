const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const amadeusService = require('../services/amadeusService');
const currencyService = require('../services/currencyService');

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
router.get('/search', (req, res) => {
    res.render('search', {
        title: 'Wyszukaj hotele',
        message: 'Znajdź swój idealny hotel'
    });
});

// Wyszukiwanie hoteli przez API
router.post('/search', async (req, res) => {
    try {
        const { destination, cityCode, checkInDate, checkOutDate, adults } = req.body;
        
        let searchCityCode = cityCode;
        
        // Jeśli mamy destination (z home page), ale nie mamy cityCode
        if (destination && !searchCityCode) {
            try {
                // Konwertuj nazwę destynacji na kod miasta
                const cityData = await amadeusService.getCityCode(destination);
                if (cityData && cityData.code) {
                    searchCityCode = cityData.code;
                    console.log(`Znaleziono kod miasta: ${searchCityCode} dla destynacji: ${destination}`);
                }
            } catch (error) {
                console.error('Błąd podczas konwersji destynacji na kod miasta:', error);
                // Nie przerywamy, kontynuujemy z kodem miasta lub bez
            }
        }
        
        if (!searchCityCode && !destination) {
            return res.render('search', {
                title: 'Wyszukaj hotele',
                message: 'Proszę podać destynację',
                error: 'Destynacja jest wymagana'
            });
        }

        // Jeśli nadal nie mamy kodu miasta, użyj pierwszych 3 liter destynacji
        if (!searchCityCode && destination) {
            searchCityCode = destination.substring(0, 3).toUpperCase();
            console.log(`Używam pierwszych 3 liter destynacji jako kod: ${searchCityCode}`);
        }

        console.log(`Wyszukiwanie hoteli: ${destination || searchCityCode}, ${checkInDate} - ${checkOutDate}, ${adults} osób`);
        
        const hotels = await amadeusService.searchHotels(
            searchCityCode.toUpperCase(), 
            parseInt(adults) || 1, 
            checkInDate, 
            checkOutDate
        );

        // Sprawdź czy mamy wyniki
        if (!hotels || hotels.length === 0) {
            return res.render('search-results', {
                title: `Brak hoteli w ${destination || searchCityCode}`,
                hotels: [],
                searchParams: {
                    cityCode: searchCityCode,
                    destination: destination || searchCityCode,
                    checkInDate,
                    checkOutDate,
                    adults
                },
                noResults: true,
                message: 'Nie znaleziono hoteli dla podanych kryteriów. Spróbuj zmienić daty lub destynację.'
            });
        }

        res.render('search-results', {
            title: `Hotele w ${destination || searchCityCode}`,
            hotels: hotels,
            searchParams: {
                cityCode: searchCityCode,
                destination: destination || searchCityCode,
                checkInDate,
                checkOutDate,
                adults
            },
            noResults: false
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
            searchParams: { cityCode, checkInDate, checkOutDate, adults }
        });

    } catch (error) {
        console.error('Błąd API wyszukiwania hoteli:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rezerwacja hotelu
router.post('/book', async (req, res) => {
    try {
        const { 
            hotelId, 
            hotelName,
            checkInDate, 
            checkOutDate, 
            adults,
            guestName,
            guestEmail,
            guestPhone,
            specialRequests,
            price,
            currency
        } = req.body;

        // Utworzenie nowej rezerwacji
        const booking = new Booking({
            hotelId,
            hotelName,
            checkInDate,
            checkOutDate,
            adults: parseInt(adults),
            guestName,
            guestEmail,
            guestPhone,
            specialRequests,
            price: parseFloat(price),
            currency
        });

        // Zapisanie rezerwacji w bazie danych
        await booking.save();

        // Wysłanie potwierdzenia
        res.json({
            success: true,
            message: 'Rezerwacja została przyjęta',
            bookingDetails: {
                bookingId: booking._id,
                hotelName: booking.hotelName,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                status: booking.status
            }
        });

    } catch (error) {
        console.error('Błąd podczas rezerwacji:', error);
        res.status(500).json({ 
            success: false,
            message: 'Wystąpił błąd podczas rezerwacji. Spróbuj ponownie później.'
        });
    }
});

module.exports = router;
