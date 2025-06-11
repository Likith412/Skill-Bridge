function parseJson(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    return null;
  }
}

module.exports = { parseJson };
