// From lingo34/novel-crawler test-bench
// This should be a minimal version of puppeteer that works
const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')()

const TurndownService = require('turndown')
const turndownService = new TurndownService()

// server config
const PORT = 9876;
const http = require('http');
const url = require('url');




/** [Deprecated and might not work] Provide interactive terminal prompts to sign into Groq
 * 
 * @param {puppeteer.Page} page page object of puppeteer browser, you can generate it by browser.newPage() with a browser object
 * @returns {Object} - The cookie object containing the cookie information: `{ stytch_session_jwt, current_org, stytch_session }`.
 */
async function manualSignIn(page) {

    await page.setExtraHTTPHeaders({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'upgrade-insecure-requests': '1',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,en;q=0.8'
    });

    // Navigate the page to a URL
    await page.goto('https://groq.com/');
    await page.locator('#chat').wait();

    // Set screen size
    // await page.setViewport({width: 1080, height: 1024});

    await page.screenshot({
        path: 'screenshot.png',
    });


    prompt(">> Login? (Enter the page and click Sign-in)>> ")

    await page.evaluate(() => {
        Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'sign in to Groq').click();
    });

    await page.screenshot({
        path: 'screenshot.png',
    })

    prompt(">> Continue? (Yes): ")

    await page.screenshot({
        path: 'screenshot.png',
    })

    let input = prompt(">> Enter your email: ").trim();


    await page.focus('#email')
    await page.keyboard.type(input)

    prompt(">> Submit email? (Yes): ")
    await page.keyboard.press('Enter');

    prompt(">> Verification email sent. Please copy the verification link sent to your email (Copied, continue): ")

    await page.screenshot({
        path: 'screenshot.png',
    })

    return await getVerified(page);

};


/**
 * Given the verification link, return cookies.
 * 
 * @param {puppeteer.Page} page - The puppeteer's page object.
 * @param {string} verificationLink - The verification link.
 * @returns {Object} - The cookie object containing the cookie information: `{ stytch_session_jwt, current_org, stytch_session }`.
 */
async function getVerified(page, verificationLink) {

    await page.goto(verificationLink);
    await page.waitForNavigation()

    // prompt("继续? (是)>> ")
    await page.locator('#chat').wait()
    return await getCookiesFromPage(verifyPage);
}

/** Check if the user is signed in
 * @param {puppeteer.page} page: puppeteer's page object
 * @return {boolean} true if signed in, false if not signed in
*/
async function getSignedInStatus(page) {

    // Navigate the page to a URL
    await page.goto('https://groq.com/');
    await page.locator('#chat').wait();

    return await page.evaluate(() => {
        let out = (Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'sign in to Groq'));
        console.log("Signed In? " + out)
        return out == undefined; // If login button is not found, then we are signed in
    });
}





/** Get cookies (format specific to this use case) from the page
 * @param page: puppeteer's page object
 * @param url: the url of the page to get cookies from
 * @return {Object} cookie object, which contains the cookie information.
 * `{ stytch_session_jwt, current_org, stytch_session }`
*/
async function getCookiesFromPage(page, url = 'https://groq.com/') {
    
    let cookies = await page.cookies(url);

    let cookieData = {};

    cookies.forEach(cookie => {
        if (cookie.name === 'stytch_session_jwt') {
            cookieData.stytch_session_jwt = cookie.value;
        } else if (cookie.name === 'user-preferences') {
            let preferences = JSON.parse(cookie.value);
            cookieData.current_org = preferences['current-org'];
        } else if (cookie.name === 'stytch_session') {
            cookieData.stytch_session = cookie.value;
        }
    });
    console.log("\n\nCookies: \n")
    console.log(cookieData);
    return cookieData;

}






/** [Deprecated] Query LLM using Puppeteer
 * 
 * @param {puppeteer.Page} page page object of puppeteer browser, you can generate it by browser.newPage() with a browser object
 * @param {string} input prompt to query
 * @param {boolean} debug optional, default to false, set to true to pause after each query
 * @returns 
 */
async function queryLLM(page, input, debug = false) {

    await page.locator('body').wait();
    await page.focus('#chat')
    await page.locator('#chat').fill(input);
    await page.keyboard.press('Enter');

    // let response = await page.locator('p.text-left').parent().waitForElementState('stable');

    // console.log("response: {");
    // console.log(response)
    // console.log("}");

    // wait till the response is done (wait till the copy button is visible)
    await page.locator('div.w-min.cursor-pointer').wait();

    // const elements = await page.$$('p.text-left');
    // let textContent = await element.evaluate(node => node.textContent) + "\n";

    const element = await page.$('p.text-left'); // find 'p.text-left' 元素
    const parentElement = await (await element.getProperty('parentNode')).asElement(); // get parent element
    const innerHTML = await parentElement.evaluate(node => node.innerHTML); // get innerHTML of parent element


    textContent = turndownService.turndown(innerHTML)


    console.log("\n## Response:");
    console.log(textContent);

    if (debug)
        prompt("\n>> Continue? (Clear Chat) ")

    // clear the chat history so the api is stateless
    await page.evaluate(() => {
        Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Clear chat').click();
    });

    return textContent;

    // await page.keyboard.type(input)
}



// 
// return: 
//         sample return:
// {
//   object: 'list',
//   data: [
//     {
//       id: 'gemma-7b-it',
//       object: 'model',
//       created: 1693721698,
//       owned_by: 'Google',
//       active: true,
//       context_window: 8192
//     },
//      .......
//   ]
// }

/** [Deprecated] Get the list of models using Puppeteer
 * 
 * @param {puppeteer.Page} page puppeteer's page object 
 * @returns {Object} list of models. In the following format:
 * {
 *   object: 'list',
 *   data: [
 *     {
 *       id: 'gemma-7b-it',
 *       object: 'model',
 *       created: 1693721698,
 *       owned_by: 'Google',
 *       active: true,
 *       context_window: 8192
 *     },
 *      .......
 *   ]
 * }
 */
async function listModelsPuppeteer(page) {
    return new Promise(async (resolve, reject) => {
        page.on('framenavigated', async () => {
            try {
                const result = await page.evaluate(async () => {
                    const cookie = document.cookie;
                    const stytchSessionJwt = cookie.match(/stytch_session_jwt=([^;]*)/)[1];
                    const userPreferences = cookie.match(/user-preferences=([^;]*)/)[1];
                    const org = JSON.parse(userPreferences)['current-org'];

                    const response = await fetch('https://api.groq.com/openai/v1/models', {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + stytchSessionJwt,
                            'Content-Type': 'application/json',
                            'Groq-Organization': org
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    return await response.json();
                });
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    });
}


/** Get the list of models. This function sends a request to the server directly so does not use puppeteer.
 * 
 * @param {*} cookies cookie object. It must contains the following properties: `{ stytch_session_jwt, current_org, stytch_session }`
 * @returns {Object} list of models. In the following format:
 * {
 *   object: 'list',
 *   data: [
 *     {
 *       id: 'gemma-7b-it',
 *       object: 'model',
 *       created: 1693721698,
 *       owned_by: 'Google',
 *       active: true,
 *       context_window: 8192
 *     },
 *      .......
 *   ]
 * }
 */
async function listModels(cookies) {

    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + cookies.stytch_session_jwt,
                'Content-Type': 'application/json',
                'Groq-Organization': cookies.current_org
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error(error);
    }


}




/** Chat completion by calling the Groq API directly. This function sends a request to the server directly so does not use puppeteer.
 * 
 * @param {Object} cookies cookie object. It must contains the following properties: `{ stytch_session_jwt, current_org, stytch_session }`
 * @param {Object} payload payload object following the OpenAI/Groq API format. See Groq API documentation for more information.
 * #### Here is an example of the payload object
 *
 * {
 *     "model": "llama3-8b-8192",
 *     "messages": [
 *         {
 *             "content": "Please provide useless but funny response. Do not be helpful",
 *             "role": "system"
 *         },
 *         {
 *             "content": "Describe the steps involved in the process of photosynthesis.",
 *             "role": "user"
 *         }
 *     ],
 *     "temperature": 0.2,
 *     "max_tokens": 2048,
 *     "top_p": 0.8,
 *     "stream": true
 * };
 * @param {*} sseResponse Optional sseResponse object. If provided, the response will be streamed to the sseResponse object.
 * @returns {string} The complete text of the chat completion.
 */
async function chatCompletion(cookies, payload, sseResponse = null) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + cookies.stytch_session_jwt,
            'Content-Type': 'application/json',
            'groq-organization': cookies.current_org
        },
        body: JSON.stringify(payload)
    });

    console.log({
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + cookies.stytch_session_jwt,
            'Content-Type': 'application/json',
            'groq-organization': cookies.current_org
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let completeText = '';

    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            if (sseResponse) {
                sseResponse.write(line + '\n');
            }
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith('data:')) {
                const data = line.slice(5).trim();

                if (data === '[DONE]') {
                    return completeText;
                } else {
                    try {
                        const parsedData = JSON.parse(data);
                        const content = parsedData.choices[0].delta.content;

                        if (content) {
                            process.stdout.write(content);
                            completeText += content;
                        }
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        console.error('JSON:', data);
                    }
                }
            }
        }
    }

    return completeText;
}









//  ===== main

/** Main function of the CLI.
 * 
 * @returns 
 */
async function cli() {

    const banner = `Welcome to Groq-Proxy (github.com/t41372/groq-proxy)\n
   ______                       ____                       
  / ____/________  ____ _      / __ \\_________  _  ____  __
 / / __/ ___/ __ \\/ __ \`/_____/ /_/ / ___/ __ \\| |/_/ / / /
/ /_/ / /  / /_/ / /_/ /_____/ ____/ /  / /_/ />  </ /_/ / 
\\____/_/   \\____/\\__, /     /_/   /_/   \\____/_/|_|\\__, (_)
                   /_/                            /____/   
`;

    console.log(banner)

    const browser = await startBrowser();
    const page = await browser.newPage();
    await page.goto('https://groq.com/');
    await page.locator('#chat').wait();
    

    // await go("https://groq.com/");

    // await signIn(browser);

    console.log("\n\nChecking sign-in status...\n")
    let signedInStatus = await getSignedInStatus(page);
    console.log("Signed In: " + signedInStatus + "\n");
    let cookies = {};

    if (!signedInStatus) {
        prompt("Not logged in? Log in now! >> ")
        console.log("Steps: \n1. Go to the Groq website (https://groq.com/)\n2. Click on Sign-in\n3. Enter your email\n4. Copy the verification link (don't open it!)\n5. Paste the verification link here\n\n")
        cookies = await getVerified(page, prompt("Enter the verification link: "));
    } else {
        console.log("Already signed in. Proceeding...\n")
        cookies = await getCookiesFromPage(page, 'https://groq.com/');
    }
    await page.close();
    await browser.close();




    // Login successful, continue to query LLM

    

    // const cookies = await getCookiesFromPage(page);;


    // console.log(await listModels(cookies));


    // createProxyServer(cookies);
    createServer(cookies).listen(PORT, () => {
        console.log(`\nServer listening on port ${PORT}... [Ctrl+C to exit]`);
    });;


    // manual query, deprecated
    while (false) {
        if (prompt(">> Continue? (Press any key to continue or type exit to exit)") == "exit")
            break;
        // await queryLLM(page, prompt("Enter your prompt: "), debug);
        let response = await chatCompletion(cookies, {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "content": "",
                    "role": "system"
                },
                {
                    "content": prompt("Enter your prompt: "),
                    "role": "user"
                }
            ],
            "temperature": 0.2,
            "max_tokens": 2048,
            "top_p": 0.8,
            "stream": true
        });
        console.log("\n\nReturned response: \n\n");
        console.log(response);
    }

    // prompt("Enter anything to continue >> ")

    

    return;
}

(async () => {
    await cli();
    return;
})();





// >>>>>>>. Server <<<<<<<

/** Create the API server that listens to the port and handles the requests.
 * 
* @param {*} Cookies cookie object. It must contains the following properties: `{ stytch_session_jwt, current_org, stytch_session }`
 * @returns {http.Server} A new instance of the server. Remember to launch the server by calling `server.listen(PORT)`.
 */
function createServer(Cookies) {

    return http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url);


        if (req.method === 'GET' && parsedUrl.pathname === `/v1/models`) {
            const result = await listModels(Cookies);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        }

        else if (req.method === 'POST' && parsedUrl.pathname === `/v1/chat/completions`) {
            let payload = '';
            req.on('data', chunk => {
                payload += chunk.toString();
            });
            req.on('end', async () => {
                payload = JSON.parse(payload);

                console.log('\n\nParsed Payload:\n');
                console.log(payload);
                console.log('\n\n');

                // initiate the server-sent event
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': "no-cache",
                    'Connection': "keep-alive"
                });
                // handle the rest of the response streaming in chatCompletion. res will be closed 
                const result = await chatCompletion(Cookies, payload, res);
                res.end();
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

}






// ===================== Tools =======================

/** Start the browser and return the browser object
 * 
 * @returns {puppeteer.Browser} The browser object
 */
async function startBrowser() {
    const { join } = require('path');

    // Launch the browser and open a new blank page
    return browser = await puppeteer.launch({
        headless: 'new',
        cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
        // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',

        args: [
            "--user-data-dir=./chromeTemp", // Save browser data (cookies) in a temp folder
            // Turn on the following options to avoid problems with anti puppeteer measures
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],

    });

}


