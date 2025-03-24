require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiChatEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureSentimentEndpoint: process.env.AZURE_SENTIMENT_ENDPOINT,
  azureSentimentKey: process.env.AZURE_SENTIMENT_ANALYTICS_KEY,
  deployment : "gpt-4o-2", // This must match your deployment name
};
