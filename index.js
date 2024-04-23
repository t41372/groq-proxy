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



// Action: Sign in to Groq
// page: page object of puppeteer browser, you can generate it by browser.newPage() with a browser object
async function signIn(page) {

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

    console.log(">> Verification email sent. Please copy the verification link sent to your email (Copied, continue): ")

    await page.screenshot({
        path: 'screenshot.png',
    })


    let newURL = prompt(">> Paste the verification link here (continue): ")

    await page.goto(newURL);

    // prompt("继续? (是)>> ")

    await page.locator('#chat').wait();


    if (await signedIn(browser)) {
        console.log("Logged in successfully!")
        return true
    }
    else {
        console.log("Failed to log in")
        return false
    }



};

// Check if the user is signed in
// page: puppeteer's page object
// return: true if signed in, false if not signed in
async function signedIn(page) {

    // Navigate the page to a URL
    await page.goto('https://groq.com/');
    await page.locator('#chat').wait();

    let loginButtonNotFound = await page.evaluate(() => {
        let out = (Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'sign in to Groq'));
        console.log("Signed In? " + out)
        return out == undefined; // If login button is not found, then we are signed in
    });

    console.log("Signed In: " + loginButtonNotFound);
    return loginButtonNotFound;
}

// [Deprecated] Query LLM using Puppeteer
// page: page object of puppeteer browser, you can generate it by browser.newPage() with a browser object
// input: prompt to query
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


// [Deprecated] Get the list of models using Puppeteer
// page: puppeteer's page object
// return: list of models
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

// Get the list of models. This function sends a request to the server directly so does not use puppeteer.
// cookie: cookie object, which contains the cookie information
//          The cookie object should have the following properties:
// {
//   stytch_session_jwt: 'some_jwt_token',
//   current_org: 'org_some_org',
//   stytch_session: 'some_session_token'
// }
// 
// return: list of models
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



// Chat completion
// cookies: cookie object, which contains the cookie information
//          The cookie object should have the following properties:
// {
//   stytch
// }
// payload: payload object, which contains the payload information
//          The payload object should have the following properties:
//
// {
//     "model": "llama3-8b-8192",
//     "messages": [
//         {
//             "content": "Please provide useless but funny response. Do not be helpful",
//             "role": "system"
//         },
//         {
//             "content": "Describe the steps involved in the process of photosynthesis.",
//             "role": "user"
//         }
//     ],
//     "temperature": 0.2,
//     "max_tokens": 2048,
//     "top_p": 0.8,
//     "stream": true
// };
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




async function getCookies(page) {
    let cookies = await page.cookies();

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

    console.log(cookieData);
    return cookieData;

}




//  ===== main

async function cli() {

    const browser = await startBrowser();

    // await go("https://groq.com/");

    // await signIn(browser);

    let signedInStatus = await signedIn(await browser.newPage());


    if (!signedInStatus) {
        prompt("Not logged in? Log in now! >> ")
        let success = await signIn(await browser.newPage());
        if (!success) {
            console.log("Fail to log in, exiting...")
            return;
        }
    }



    // Login successful, continue to query LLM

    const page = await browser.newPage();
    await page.goto('https://groq.com/');

    const cookies = await getCookies(page);;


    // console.log(await listModels(cookies));


    // createProxyServer(cookies);
    createServer(cookies).listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });;




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

    prompt("Enter anything to exit >> ")

    console.log("Exiting...")
    await browser.close();

    return;
}

(async () => {
    await cli();
    return;
})();





// >>>>>>>. Server <<<<<<<


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

// 启动浏览器
// 返回一个browser对象
async function startBrowser() {

    // Launch the browser and open a new blank page
    return browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',

        args: [
            "--user-data-dir=./chromeTemp", // Save browser data (cookies) in a temp folder
            // Turn on the following options to avoid problems with anti puppeteer measures
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],

    });

}


