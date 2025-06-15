// Wczytaj zmienne środowiskowe na samym początku
require('dotenv').config();
// Debug .env loading
console.log('dotenv loaded, process.env.AMADEUS_CLIENT_ID =', process.env.AMADEUS_CLIENT_ID);
console.log('Current working directory:', process.cwd());
const fs = require('fs');
console.log('.env file exists:', fs.existsSync('.env'));

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


// Middleware do parsowania danych
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Obsługa sesji - zmodyfikowana dla lepszej persystencji
app.use(session({
    secret: 'tajny_klucz',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 godziny
    }
}));

// Middleware do przekazywania informacji o zalogowanym użytkowniku do szablonów
app.use((req, res, next) => {
    // Zapewnienie, że res.locals jest dostępne
    if (!res.locals) {
        res.locals = {};
    }
    
    // Przekazanie danych użytkownika do szablonów
    res.locals.user = req.session.user;
    res.locals.userId = req.session.userId;
    res.locals.isAdmin = req.session.isAdmin;
    
    next();
});

app.use('/hotels', hotelsRoutes);

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Homepage route
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Booking - Znajdź idealny hotel'
    });
});

// Social media routes
app.get('/social/instagram', (req, res) => {
    res.render('social/instagram');
});

app.get('/social/facebook', (req, res) => {
    res.render('social/facebook');
});

app.get('/social/x', (req, res) => {
    res.render('social/x');
});

app.get('/social/twitter', (req, res) => {
    res.render('social/twitter');
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
            return res.render('register', {
                title: 'Rejestracja',
                error: 'Użytkownik o takim e-mailu już istnieje.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword
        });

        await newUser.save();
        
        // Automatycznie zaloguj użytkownika po rejestracji
        req.session.user = newUser.email;
        req.session.userId = newUser._id;
        
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('register', {
            title: 'Rejestracja',
            error: 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.'
        });
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
        if (!user) {
            return res.render('login', {
                title: 'Logowanie',
                error: 'Nieprawidłowy email lub hasło.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', {
                title: 'Logowanie',
                error: 'Nieprawidłowy email lub hasło.'
            });
        }

        req.session.user = user.email;
        req.session.userId = user._id;
        req.session.isAdmin = user.isAdmin || false;
        
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('login', {
            title: 'Logowanie',
            error: 'Wystąpił błąd podczas logowania. Spróbuj ponownie później.'
        });
    }
});

// Wylogowanie
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Błąd podczas wylogowywania:', err);
        }
        res.redirect('/');
    });
});

// Start serwera
app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});


