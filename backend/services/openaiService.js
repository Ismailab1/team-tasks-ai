const { AzureOpenAI } = require("openai");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const {
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_API_VERSION,
  AZURE_SENTIMENT_ENDPOINT,
  AZURE_SENTIMENT_KEY
} = process.env;

const client = new AzureOpenAI({
  endpoint: AZURE_OPENAI_ENDPOINT,
  apiKey: AZURE_OPENAI_API_KEY,
  apiVersion: AZURE_OPENAI_API_VERSION,
  deployment: AZURE_OPENAI_DEPLOYMENT
});

async function createChatCompletion(messages) {
  try {
    console.log("📨 Sending message to Azure OpenAI...", messages);

    const result = await client.chat.completions.create({
      messages,
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    console.log("✅ Azure OpenAI Response:", result);
    return result.choices[0].message.content;
  } catch (error) {
    console.error("❌ Azure OpenAI API Error:", error);
    throw new Error("Failed to get response from Azure OpenAI.");
  }
}

const analyzeSentiment = async (text) => {
  try {
    const response = await axios.post(
      AZURE_SENTIMENT_ENDPOINT,
      { documents: [{ id: "1", text }] },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_SENTIMENT_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.documents[0].sentiment;
  } catch (error) {
    console.error("❌ Sentiment Analysis Error:", error);
    return "neutral";
  }
};

module.exports = { createChatCompletion, analyzeSentiment };
