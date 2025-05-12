const express = require('express');
const path = require('path');
const config = require('./config');

const mongoose = require('mongoose');

const hotelsRoutes = require('../routes/hotels');

const app = express();
mongoose.connect('mongodb+srv://sebaswit46:Pilkareczna17@cluster0.wkiftrn.mongodb.net/booking?retryWrites=true&w=majority')
    .then(() => console.log(" Połączono z MongoDB"))
    .catch(err => console.error(" Błąd połączenia z MongoDB:", err));


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));
app.use('/hotels', hotelsRoutes);

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Homepage route
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Booking.com Clone',
        message: 'Welcome to our Hotel Booking Website'
    });
});

app.get('/hotel-view', (req, res) => {
    res.render('hotel', {
        title: 'Detailed hotel view',
        message: 'This is a detailed hotel view'
    })
})

// Start server
app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});


