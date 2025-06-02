const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Registration route
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        console.log(`\n[REJESTRACJA] Próba rejestracji użytkownika: ${email}`);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`[BŁĄD] Użytkownik o emailu ${email} już istnieje`);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName
        });

        await user.save();
        console.log(`[SUKCES] Zarejestrowano nowego użytkownika: ${email}`);

        // Set user session
        req.session.userId = user._id;

        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.log(`[BŁĄD] Problem podczas rejestracji: ${error.message}`);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`\n[LOGOWANIE] Próba logowania użytkownika: ${email}`);

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[BŁĄD] Nie znaleziono użytkownika: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`[BŁĄD] Nieprawidłowe hasło dla użytkownika: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set user session
        req.session.userId = user._id;
        console.log(`[SUKCES] Zalogowano użytkownika: ${email}`);

        res.json({ message: 'Login successful' });
    } catch (error) {
        console.log(`[BŁĄD] Problem podczas logowania: ${error.message}`);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    console.log(`\n[WYLOGOWANIE] Próba wylogowania użytkownika`);
    req.session.destroy((err) => {
        if (err) {
            console.log(`[BŁĄD] Problem podczas wylogowania: ${err.message}`);
            return res.status(500).json({ message: 'Error logging out' });
        }
        console.log(`[SUKCES] Użytkownik został wylogowany`);
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;