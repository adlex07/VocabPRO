<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/10pYSYK-xN6A8ZWxvZuMHluThVqZEleub

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set up your API keys in [.env.local](.env.local):
   - **Required**: `GEMINI_API_KEY` - Your Google Gemini API key (default provider)
   - **Optional**: `CEREBRAS_API_KEY` - Your Cerebras Inference API key (alternative provider)
   
   You can copy `.env.local.example` to `.env.local` and fill in your keys.
3. Run the app:
   `npm run dev`

## LLM Provider Options

This app supports two LLM providers that you can switch between in the Settings:

### Google Gemini (Default)
- **Model**: gemini-3-flash-preview
- **Setup**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Set in**: `GEMINI_API_KEY` environment variable

### Cerebras Inference
- **Model**: llama3.1-8b
- **Features**: Fast inference with Llama models
- **Setup**: Get your API key from [Cerebras Cloud](https://cloud.cerebras.ai/)
- **Documentation**: 
  - [Introduction](https://inference-docs.cerebras.ai/introduction)
  - [Models Overview](https://inference-docs.cerebras.ai/models/overview)
- **Set in**: `CEREBRAS_API_KEY` environment variable

You can configure API keys either through environment variables or directly in the app's Settings panel.
