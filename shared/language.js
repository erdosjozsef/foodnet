function getLanguageCode(language) {
  let languageCode;
  if (language == "ro") {
    languageCode = 1;
  } else if (language == "hu") {
    languageCode = 2;
  } else {
    languageCode = 3;
  }
  return languageCode;
}

module.exports = { getLanguageCode };
