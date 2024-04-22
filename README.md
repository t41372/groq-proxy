



Implemented
- Sign in to groq account
- Verify Sign in
- Query LLM
- Start to transition from puppeteer emulation to direct api calls
- Text Completion with Role/System prompt settings ~~但我这个要怎么设role啊... 还是要抓包吗... (2024.04.21: 是的, 要抓包) (2024.04.22: 报告，抓好了)~~
- Switch model
- Edit System Prompt
- View Models (now using http get instead of puppeteer)


To-do
- Implement API server based on groq api / openai api / ollama, potentially using http-proxy
  - try http proxy to just rewrite the http request (not sure about the SSE stream response)
  - or create interface for all of the required functions according to the api doc
- Create no puppeteer mode (just provide the cookies)


