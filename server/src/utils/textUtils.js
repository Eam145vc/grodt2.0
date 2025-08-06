const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD") // Descompone los caracteres en su forma base y diacríticos
    .replace(/[\u0300-\u036f]/g, "") // Elimina los diacríticos
    .replace(/[’‘´`]/g, "'") // Normaliza diferentes tipos de apóstrofos a uno estándar
    .trim();
};

const removeEmojis = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u2700-\u27BF]|[\u1F1E6-\u1F1FF]|[\u1F300-\u1F5FF]|[\u1F600-\u1F64F]|[\u1F680-\u1F6FF]/g, '')
    .trim();
};

const flagToCountryMap = {
  '🇦🇷': 'argentina',
  '🇧🇴': 'bolivia',
  '🇧🇷': 'brasil',
  '🇨🇱': 'chile',
  '🇨🇴': 'colombia',
  '🇨🇷': 'costarica',
  '🇨🇺': 'cuba',
  '🇪🇨': 'ecuador',
  '🇸🇻': 'elsalvador',
  '🇪🇸': 'espana',
  '🇬🇹': 'guatemala',
  '🇭🇳': 'honduras',
  '🇲🇽': 'mexico',
  '🇳🇮': 'nicaragua',
  '🇵🇦': 'panama',
  '🇵🇾': 'paraguay',
  '🇵🇪': 'peru',
  '🇵🇷': 'puertorico',
  '🇩🇴': 'republicadominicana',
  '🇺🇾': 'uruguay',
  '🇻🇪': 'venezuela'
};

module.exports = { normalizeString, removeEmojis, flagToCountryMap };