
const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');


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
module.exports = router;
