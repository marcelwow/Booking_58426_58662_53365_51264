const express = require('express');
const path = require('path');
const config = require('./config');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const hotelsRoutes = require('../routes/hotels');
const app = express();

mongoose.connect('mongodb+srv://sebaswit46:Pilkareczna17@cluster0.wkiftrn.mongodb.net/booking?retryWrites=true&w=majority')
    .then(() => console.log(" Połączono z MongoDB"))
    .catch(err => console.error(" Błąd połączenia z MongoDB:", err));


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));
app.use('/hotels', hotelsRoutes);

// Obsługa sesji
app.use(session({
    secret: 'tajny_klucz',
    resave: false,
    saveUninitialized: true,
}));

// EJS
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
    });
});

// Rejestracja
app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Rejestracja'
    });
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.send('Użytkownik o takim e-mailu już istnieje.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.send('Wystąpił błąd podczas rejestracji.');
    }
});

// Logowanie
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Logowanie'
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.send('Nieprawidłowy email lub hasło.');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.send('Nieprawidłowy email lub hasło.');

        req.session.user = user.email;
        res.send('Zalogowano pomyślnie!');
    } catch (err) {
        console.error(err);
        res.send('Wystąpił błąd podczas logowania.');
    }
});

// Start serwera
app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});


