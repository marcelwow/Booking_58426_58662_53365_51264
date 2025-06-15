const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');

// Connection string - taki sam jak w server.js
mongoose.connect('mongodb+srv://sebaswit46:Pilkareczna17@cluster0.wkiftrn.mongodb.net/booking?retryWrites=true&w=majority')
    .then(() => console.log('Połączono z MongoDB'))
    .catch(err => console.error('Błąd połączenia:', err));

const sampleHotels = [
    {
        name: "Hotel Warszawa Premium",
        city: "Warszawa", 
        price: 350,
        rating: 4,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"
    },
    {
        name: "Kraków Palace Hotel",
        city: "Kraków",
        price: 280,
        rating: 5,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500"
    },
    {
        name: "Hotel Gdański",
        city: "Gdańsk",
        price: 220,
        rating: 3,
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500"
    },
    {
        name: "Wrocław Business Center",
        city: "Wrocław", 
        price: 190,
        rating: 4,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500"
    }
];

async function seedHotels() {
    try {
        // Usuń istniejące hotele
        await Hotel.deleteMany({});
        console.log('Usunięto stare hotele');

        // Dodaj nowe hotele
        await Hotel.insertMany(sampleHotels);
        console.log('Dodano przykładowe hotele');

        console.log('Seeding zakończony pomyślnie!');
        process.exit(0);
    } catch (error) {
        console.error('Błąd podczas seedingu:', error);
        process.exit(1);
    }
}

seedHotels(); 