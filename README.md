## Groq-Proxy: Turn groq webui into free API (OpenAI Compatible). Super Fast Inference for free

> :warning all content in this repository are for experimental purposes


This program offers free self-hosted API access to groq (which has super fast inference for open source llm like `LLaMA3 70b`, `Mixtral 8x7b`, and some other models) with OpenAI compatible format, so no code changes are needed.


### Implemented
- Sign in to groq account
- Verify Sign in
- Query LLM
- Start to transition from puppeteer emulation to direct api calls
- Text Completion with Role/System prompt settings ~~但我这个要怎么设role啊... 还是要抓包吗... (2024.04.21: 是的, 要抓包) (2024.04.22: 报告，抓好了)~~
- Switch model
- Edit System Prompt
- View Models (now using http get instead of puppeteer)
- Implement API server based on groq api / openai api ~~/ ollama, potentially using http-proxy~~
  - Implemented `/v1/chat/completions` and `/v1/models` api, which are OpenAI Compatible. Just have the server running, set your OpenAI Endpoint to `http://localhost:9876`, and you should be good to go.


### To-do
- Create no puppeteer mode (just provide the cookies or something similar)
- dockerize this thing


## Installation


- Clone this repo and open the repo's folder
- npm install (some puppeteer related settings may need attention)
- `node index.js` to run this program
  - You will need to sign into groq. 
  - The puppeteer headless browser will ask you for your email.
  - After entering your email, a verification email will be sent. Copy the link (don't open it)
  - Paste the link into the program
  - The cookies will be extracted and you are good to go










