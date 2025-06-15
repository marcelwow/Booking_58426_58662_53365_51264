const PORT = process.env.PORT || "3000";
// Używamy stałych kluczy API zamiast zmiennych środowiskowych
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || "LPzxudVqtoQM3QnAK5ExLgyOuvwsGe2z";
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || "wsQAZxV2PoL2H5UE";

module.exports = {
    PORT,
    amadeus: {
        clientId: AMADEUS_CLIENT_ID,
        clientSecret: AMADEUS_CLIENT_SECRET
    }
};
