# Booking App - Aplikacja Rezerwacji Hoteli

Nowoczesna aplikacja do wyszukiwania i rezerwacji hoteli z integracją Amadeus API.

## 🚀 Funkcjonalności

- **Wyszukiwanie hoteli** przez Amadeus API (prawdziwe dane hoteli)
- **Filtrowanie** po mieście, datach pobytu i liczbie osób
- **Szczegółowe informacje** o hotelach z cenami i udogodnieniami
- **Rejestracja i logowanie** użytkowników
- **Responsywny design** z Bootstrap 5
- **Lokalne hotele** z MongoDB

## 📋 Wymagania

- Node.js (v14+)
- MongoDB
- Konto Amadeus for Developers

## ⚙️ Instalacja i Konfiguracja

### 1. Sklonuj repozytorium
```bash
git clone <url-repo>
cd booking-app
```

### 2. Zainstaluj zależności
```bash
npm install
```

### 3. Konfiguracja Amadeus API

1. Zarejestruj się na [Amadeus for Developers](https://developers.amadeus.com/)
2. Utwórz nową aplikację i pobierz klucze API
3. Utwórz plik `.env` w głównym katalogu:

```env
# Amadeus API Configuration
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here

# Port aplikacji
PORT=3000

# Session Secret
SESSION_SECRET=your_strong_session_secret_here
```

### 4. Konfiguracja MongoDB

Upewnij się, że masz działającą instancję MongoDB. Connection string jest już skonfigurowany w `src/server.js`.

### 5. Uruchom aplikację

```bash
# Tryb produkcyjny
npm start

# Tryb rozwojowy (z nodemon)
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

## 🛠️ API Endpoints

### Hotele
- `GET /hotels` - Lista lokalnych hoteli z bazy danych
- `GET /hotels/search` - Formularz wyszukiwania hoteli
- `POST /hotels/search` - Wyszukiwanie hoteli przez Amadeus API
- `GET /hotels/details/:hotelId` - Szczegóły hotelu
- `GET /hotels/api/search` - API endpoint do wyszukiwania (JSON)
- `POST /hotels/search-by-location` - Wyszukiwanie po współrzędnych GPS

### Autoryzacja
- `GET /register` - Formularz rejestracji
- `POST /register` - Rejestracja użytkownika
- `GET /login` - Formularz logowania
- `POST /login` - Logowanie użytkownika

## 🎯 Kody Miast (IATA)

Aplikacja używa kodów IATA do wyszukiwania hoteli:

- **WAW** - Warszawa
- **KRK** - Kraków  
- **PAR** - Paryż
- **LON** - Londyn
- **ROM** - Rzym
- **BCN** - Barcelona
- **BER** - Berlin
- **NYC** - Nowy Jork

## 🔧 Struktura Projektu

```
├── src/
│   ├── server.js          # Główny plik serwera
│   └── config.js          # Konfiguracja aplikacji
├── services/
│   └── amadeusService.js  # Service do obsługi Amadeus API
├── routes/
│   └── hotels.js          # Endpointy hotelowe
├── models/
│   ├── Hotel.js           # Model hotelu (MongoDB)
│   └── User.js            # Model użytkownika
├── views/
│   ├── search.ejs         # Formularz wyszukiwania
│   ├── search-results.ejs # Wyniki wyszukiwania
│   ├── hotel-details.ejs  # Szczegóły hotelu
│   └── error.ejs          # Strona błędów
└── public/                # Pliki statyczne
```

## 🐛 Rozwiązywanie Problemów

### Błąd: "Client credentials are invalid"
- Sprawdź czy klucze Amadeus API są poprawnie skonfigurowane w `.env`
- Upewnij się, że używasz kluczy z trybu testowego Amadeus

### Błąd: "Nie można wyszukać hoteli"
- Sprawdź połączenie internetowe
- Sprawdź czy kod miasta (IATA) jest poprawny
- Sprawdź logi serwera dla szczegółowych informacji

### Bootstrap & SCSS

Projekt wykorzystuje **Bootstrap 5** do stylowania.

Dla rozwoju z SCSS:
1. `npm install bootstrap@5.3.5`
2. `npm install -g sass`
3. Skonfiguruj File Watchers w IDE (dla WebStorm):
   - Zainstaluj plugin Sass
   - `Ctrl + Alt + S` → File Watchers
   - Dodaj watcher dla plików .scss

## 📞 Wsparcie

W przypadku problemów skontaktuj się:
- Email: support@booking.com  
- Telefon: +48 123 456 789

## 📄 Licencja

Ten projekt jest udostępniony na licencji MIT.

