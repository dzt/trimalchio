# trimalchio
Easy to use Shopify Bot, works for a majority of Shopify websites but still could use some work. This project is still under active development so please do not spam my email <3.

** Note: If you know that a site only supports PayPal as a checkout method, be sure to have OneTouch enabled on your PayPal account to enhance the speed. **

![term](http://i.imgur.com/HHyh0KG.png)

### Installation

trimalchio requires [Node.js](http://nodejs.org/). (*Be sure to download the LTS version).

Setup:

```sh
$ git clone https://github.com/dzt/trimalchio.git
$ cd trimalchio
$ npm install
```
Run After Setup:

```sh
$ node index.js
```

Launch Flags (not added yet):
```
  --restock   Run in Restock Mode with keywords from your config file.

  --new       Picks up newly added items, instead of using keywords.
```

**When you are prompted to set up everything, a `config.json` file will be generated with all all your configurations allowing you to simply edit the values.**

- [ ] Proxy Support
- [x] General Shopify Support
- [ ] Time Scheduler
- [ ] Sitemap Support
- [ ] Better Error Handling
- [x] Show Stock Count
- [ ] Queue support
- [ ] Negative Keywords
- [ ] Multiple Tasks
- [x] Custom Menu
- [ ] Slack Integration
- [ ] Preset Size and Styling Configurations (adding multiple at once)

### Who
Written by <a href="http://petersoboyejo.com/">@dzt</a>, made better by you.

## License

```
The MIT License (MIT)

Copyright (c) 2017 Peter Soboyejo <http://petersoboyejo.com/>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
