
const puppeteer = require('puppeteer-extra');
var userAgent = require('user-agents');
var cors = require('cors')
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const express = require('express')
const app = express()
const port = 3000
process.setMaxListeners(0);


const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: '2captcha', token: 'd52ad1eb9a8cb7c11b5284731cceec7d' }, 
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

puppeteer.use(StealthPlugin());

/*app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});*/

app.use(cors()) // Use this after the variable declaration
app.get("/scrapping/:ced", function (req, res) {
/*res.setHeader("Access-Control-Allow-Origin", "*")
res.setHeader("Access-Control-Allow-Credentials", "true");
res.setHeader("Access-Control-Max-Age", "1800");
res.setHeader("Access-Control-Allow-Headers", "content-type");
res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );*/
  
   let ced = req.params.ced;
   
  let scrape = async () => {
    const browser = await puppeteer.launch({ headless: true,executablePath:
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            args: [
         '--disable-gpu',
         '--disable-dev-shm-usage',
         '--disable-setuid-sandbox',
         '--no-sandbox',
         '--disable-web-security',
         '--disable-features=IsolateOrigins',
         '--disable-site-isolation-trials',
         '--disable-features=BlockInsecurePrivateNetworkRequests',
    ],
      slowMo:10 });
    
    const page = (await browser.pages())[0];
    const timeout = 0;
    await page.setUserAgent(userAgent.random().toString())
    
    page.setDefaultTimeout(timeout);

    {
        const targetPage = page;
        await targetPage.setViewport({
            width: 722,
            height: 753
        })
    }
    {
        const targetPage = page;
        await targetPage.goto('https://wsp.registraduria.gov.co/censo/consultar');
    }
    {
        const targetPage = page;
        const element = await waitForSelectors([
            [
                '#nuip'
            ]
        ], targetPage, { timeout, visible: true });
        await element.click({
          offset: {
            x: 177.8000030517578,
            y: 28.399993896484375,
          },
        });
        
    }
    {
        const targetPage = page;
        const element = await waitForSelectors([
            [
                '#nuip'
            ]
        ], targetPage, { timeout, visible: true });
   
        const inputType = await element.evaluate(el => el.type);
        if (inputType === 'select-one') {
          await changeSelectElement(element, ced)
        } else if ([
            'textarea',
            'text',
            'url',
            'tel',
            'search',
            'password',
            'number',
            'email'
        ].includes(inputType)) {
          await typeIntoElement(element, ced);
        } else {
          await changeElementValue(element, ced);
        }
   
    }
   
    {
        const targetPage = page;
   

const { captchas, solutions, solved, error } = await targetPage.solveRecaptchas()

    }
    {
        const targetPage = page;
        
        const element = await waitForSelectors([
            [
                '#enviar'
            ],
            [
                'text/Consultar'
            ]
        ], targetPage, { timeout, visible: true });
        await element.click({
          offset: {
            x: 71.79998779296875,
            y: 19.89996337890625,
          },
        });

        
    }
    {
      const targetPage = page; 
      const element = await waitForSelectors([
            [
                '#consulta > tbody > tr'
            ]
        ], targetPage, { timeout, visible: true });
        

        const dato = await targetPage.evaluate(() => {
         const tableBody = document.querySelectorAll('#consulta tbody td');
         return Array.from(tableBody).map(element => element.innerText);
        });
       //console.log(dato) 
       //return(dato);
       res.json(
        {
            "cedula":dato[0],
            "dpto": dato[1],
            "muni": dato[2],
            "puesto": dato[3],
            "dir": dato[4],
            "mesa":dato[5] 
        }
       );


    }

    async function waitForSelectors(selectors, frame, options) {
      for (const selector of selectors) {
        try {
          return await waitForSelector(selector, frame, options);
        } catch (err) {
          console.error(err);
        }
      }
      throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
    }

    async function scrollIntoViewIfNeeded(selectors, frame, timeout) {
      const element = await waitForSelectors(selectors, frame, { visible: false, timeout });
      if (!element) {
        throw new Error(
          'The element could not be found.'
        );
      }
      await waitForConnected(element, timeout);
      const isInViewport = await element.isIntersectingViewport({threshold: 0});
      if (isInViewport) {
        return;
      }
      await element.evaluate(element => {
        element.scrollIntoView({
          block: 'center',
          inline: 'center',
          behavior: 'auto',
        });
      });
      await waitForInViewport(element, timeout);
    }

    async function waitForConnected(element, timeout) {
      await waitForFunction(async () => {
        return await element.getProperty('isConnected');
      }, timeout);
    }

    async function waitForInViewport(element, timeout) {
      await waitForFunction(async () => {
        return await element.isIntersectingViewport({threshold: 0});
      }, timeout);
    }

    async function waitForSelector(selector, frame, options) {
      if (!Array.isArray(selector)) {
        selector = [selector];
      }
      if (!selector.length) {
        throw new Error('Empty selector provided to waitForSelector');
      }
      let element = null;
      for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (element) {
          element = await element.waitForSelector(part, options);
        } else {
          element = await frame.waitForSelector(part, options);
        }
        if (!element) {
          throw new Error('Could not find element: ' + selector.join('>>'));
        }
        if (i < selector.length - 1) {
          element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
        }
      }
      if (!element) {
        throw new Error('Could not find element: ' + selector.join('|'));
      }
      return element;
    }

    async function waitForElement(step, frame, timeout) {
      const count = step.count || 1;
      const operator = step.operator || '>=';
      const comp = {
        '==': (a, b) => a === b,
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
      };
      const compFn = comp[operator];
      await waitForFunction(async () => {
        const elements = await querySelectorsAll(step.selectors, frame);
        return compFn(elements.length, count);
      }, timeout);
    }

    async function querySelectorsAll(selectors, frame) {
      for (const selector of selectors) {
        const result = await querySelectorAll(selector, frame);
        if (result.length) {
          return result;
        }
      }
      return [];
    }

    async function querySelectorAll(selector, frame) {
      if (!Array.isArray(selector)) {
        selector = [selector];
      }
      if (!selector.length) {
        throw new Error('Empty selector provided to querySelectorAll');
      }
      let elements = [];
      for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (i === 0) {
          elements = await frame.$$(part);
        } else {
          const tmpElements = elements;
          elements = [];
          for (const el of tmpElements) {
            elements.push(...(await el.$$(part)));
          }
        }
        if (elements.length === 0) {
          return [];
        }
        if (i < selector.length - 1) {
          const tmpElements = [];
          for (const el of elements) {
            const newEl = (await el.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
            if (newEl) {
              tmpElements.push(newEl);
            }
          }
          elements = tmpElements;
        }
      }
      return elements;
    }

    async function waitForFunction(fn, timeout) {
      let isActive = true;
      const timeoutId = setTimeout(() => {
        isActive = false;
      }, timeout);
      while (isActive) {
        const result = await fn();
        if (result) {
          clearTimeout(timeoutId);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Timed out');
    }

    async function changeSelectElement(element, value) {
      await element.select(value);
      await element.evaluateHandle((e) => {
        e.blur();
        e.focus();
      });
    }

    async function changeElementValue(element, value) {
      await element.focus();
      await element.evaluate((input, value) => {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    }

    async function typeIntoElement(element, value) {
      const textToType = await element.evaluate((input, newValue) => {
        if (
          newValue.length <= input.value.length ||
          !newValue.startsWith(input.value)
        ) {
          input.value = '';
          return newValue;
        }
        const originalValue = input.value;
        input.value = '';
        input.value = originalValue;
        return newValue.substring(originalValue.length);
      }, value);
      await element.type(textToType);
    }
  }

  scrape()
})

app.listen(port, () => console.log(`App de ejemplo escuchando el puerto ${port}!`))