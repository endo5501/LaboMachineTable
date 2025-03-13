import translations from './translations';

/**
 * Translates a text string to Japanese
 * @param {string} text - The English text to translate
 * @returns {string} - The Japanese translation or the original text if no translation is found
 */
const translate = (text) => {
  if (!text) return '';
  
  // Return the translation if it exists, otherwise return the original text
  return translations[text] || text;
};

export default translate;
