## Groq-Proxy: A reverse engineered API for Groq using NodeJS
Turn groq webui into free OpenAI Compatible API. Super Fast Inference for free

> :warning: all content in this repository are for experimental purposes


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
  - `/v1/chat/completions` will be streamed back using SSE
- New way of sign in: user provide verification link only


### To-do
- remove uneccesary code
- add check for validity of cookies for the api
- Create no puppeteer mode (just provide the cookies or something similar)
- dockerize this thing


## Installation


- Clone this repo and open the repo's folder
- npm install (some puppeteer related settings may need attention)
- `node index.js` to run this program.
  - If some chrome or puppeteer thing broke, run this `npx puppeteer browsers install chrome`
  - You will need to sign into groq.
  - Follow the instruction. Use your own browser to go to groq.com and sign in using your email (don't actually sign in there).
  - After entering your email, a verification email will be sent. Copy the link (don't open it)
  - Paste the link into the program
  - The cookies will be extracted and you are good to go

Note:
- Cookies will expire. You may need to restart the server and re-authenticate to get the new cookies.


## Sample
terminal code to use the api. Because it uses SSE to stream the data back, you will see a bunch of json appearing on your terminal.
~~~
curl --request POST \
  --url 'http://localhost:9876/v1/chat/completions?=' \
  -H Accept:text/event-stream
  --data '{
    "model": "llama3-70b-8192",
    "messages": [
        {
            "content": "",
            "role": "system"
        },
        {
            "content": "Hey buddy",
            "role": "user"
        }
    ],
    "temperature": 0.2,
    "max_tokens": 2048,
    "top_p": 0.8,
    "stream": true
}
'
~~~







