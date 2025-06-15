/**
 * Pobiera kurs wymiany z baseCurrency do targetCurrency
 * @param {string} baseCurrency - Kod waluty bazowej (np. 'EUR')
 * @param {string} targetCurrency - Kod waluty docelowej (np. 'PLN')
 * @returns {Promise<number>} - Kurs wymiany
 */
async function getExchangeRate(baseCurrency, targetCurrency) {
    const response = await fetch(
        `https://api.exchangerate.host/latest?base=${baseCurrency}&symbols=${targetCurrency}`
    );
    const data = await response.json();
    if (!data || !data.rates || typeof data.rates[targetCurrency] !== 'number') {
        throw new Error(`Nie można pobrać kursu dla ${baseCurrency} -> ${targetCurrency}`);
    }
    return data.rates[targetCurrency];
}

module.exports = { getExchangeRate }; 