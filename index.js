require("console-stamp")(console, {
  colors: {
    stamp: "yellow",
    label: "white",
    metadata: "green"
  }
});

function log(msg, type) {
  switch (type) {
    case "warning":
      console.warn(msg);
      break;
    case "error":
      console.error(msg);
      break;
    case "info":
      console.info(msg);
      break;
    default:
      console.log(msg);
  }
}

var dev = true
var prompt = require('prompt');
var j = require('request').jar();
var states = require('./states.json');
var request = require('request').defaults({timeout: 30000, jar: j});
var _ = require('underscore');
var cheerio = require('cheerio');
var phoneFormatter = require('phone-formatter');
var Nightmare = require('nightmare');
var wait = require('nightmare-wait-for-url');
var fs = require('fs');

var base_url = 'https://www.crapeyewear.com'
var userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'

Nightmare.action('show',
    function (name, options, parent, win, renderer, done) {
        parent.respondTo('show', function (done) {
            win.show();
            done();
        });
        done();
    },
    function (done) {
        this.child.call('show', done);
    });

prompt.message = 'crapeyewear';
var match,
  styleID,
  config,
  storeID,
  url,
  checkoutID;

var nightmareCookies = [];

prompt.start({noHandleSIGINT: true});

process.on('SIGINT', function() {
  console.log("This will execute when you hit CTRL+C");
  process.exit();
});

if (fs.existsSync('./config.json')) {
  log('Found an existing config.json, using data from file for current process.', 'warning');
  config = require('./config.json');
  start();
  log(`Looking for Keyword(s) matching "${config.keywords}"`);
} else {
  prompt.get([
    {
      name: 'keywords',
      required: true,
      description: 'Keyword(s)'
    }, {
      name: 'ccn',
      required: true,
      description: 'CC Number (with spaces)'
    }, {
      name: 'nameOnCard',
      required: true,
      description: 'Name on CC'
    }, {
      name: 'month',
      required: true,
      description: 'CC Exp Month (ex: 03)'
    }, {
      name: 'year',
      required: true,
      description: 'CC Exp Year (ex: 2019)'
    }, {
      name: 'ccv',
      required: true,
      description: 'CVV Number on Card (ex: 810)'
    }, {
      name: 'firstName',
      required: true,
      description: 'First Name'
    }, {
      name: 'lastName',
      required: true,
      description: 'Last Name'
    }, {
      name: 'address',
      required: true,
      description: 'Address'
    }, {
      name: 'city',
      required: true,
      description: 'City'
    }, {
      name: 'state',
      required: true,
      description: 'State (ex: MA, CA, NY)'
    }, {
      name: 'zipCode',
      required: true,
      description: 'Zip Code'
    }, {
      name: 'phoneNumber',
      required: true,
      description: 'Phone Number (no spaces or symbols)'
    }, {
      name: 'email',
      required: true,
      description: 'Email Address'
    }
  ], function(err, result) {
    config = result
    fs.writeFile('config.json', JSON.stringify(result, null, 4), function(err) {
      log('Config file generated! Starting process...');
      log(`Looking for Keyword(s) matching "${config.keywords}"`);
      start();
    });
  });
}

function start() {
  findItem(config.keywords, function(err, res) {
    if (err) {
      return start();
    } else {
      match = res;
      selectStyle();
    }
  });
}

function findItem(kw, cb) {
  request({
    url: 'https://www.crapeyewear.com/products.json',
    method: 'get',
    headers: {
      'User-Agent': userAgent
    }
  }, function(err, res, body) {
    if (err) {
      return cb(err, null);
    } else {
      var products = JSON.parse(body);

      var foundItems = [];
      for (var i = 0; i < products.products.length; i++) {
        var name = products.products[i].title;
        if (name.indexOf(config.keywords) > -1) {
          foundItems.push(products.products[i]);
        }
      }

      if (foundItems.length > 0) {
        if (foundItems.length === 1) {
          log(`Item Found! - "${foundItems[0].title}"`);
          match = foundItems[0];
          return cb(null, foundItems[0]);
        } else {
          log(`We found more than 1 item matching with the keyword(s) "${config.keywords}" please select the item.\n`, 'warning');
          for (var i = 0; i < foundItems.length; i++) {
            log(`Product Choice #${i + 1}: "${foundItems[i].title}"`);
          }

          prompt.get([
            {
              name: 'productSelect',
              required: true,
              description: 'Select a Product # (ex: "2")'
            }
          ], function(err, result) {
            var choice = parseInt(result.productSelect);
            match = foundItems[choice - 1];
            log(`You selected - "${match.title}`);
            return cb(null, match);
          });

        }
      } else {
        return cb('Match not found yet...', null);
      }

    }
  });
}

function selectStyle() {

  if (match.variants.length === 1) {

    styleID = match.variants[0].id;
    log(`Style Selected: "${match.variants[0].option1}" (${styleID})`);
    pay();

  } else {

    for (var i = 0; i < match.variants.length; i++) {
      var styleName = match.variants[i].option1;
      log(`Style/Size Choice #${i + 1}: "${styleName}"`);
    }

    prompt.get([
      {
        name: 'styleSelect',
        required: true,
        description: 'Select a Style # (ex: "1")'
      }
    ], function(err, result) {
      var choice = parseInt(result.styleSelect);
      styleID = match.variants[choice - 1].id;
      log(`You selected - "${match.variants[choice - 1].option1}" (${styleID})`);
      pay();
    });
  }
}

function pay() {
  request({
    url: 'https://www.crapeyewear.com/products/' + match.handle,
    followAllRedirects: true,
    method: 'get',
    headers: {
      'User-Agent': userAgent
    }
  }, function(err, res, body) {});

  request({
    url: 'https://www.crapeyewear.com/cart/add.js',
    followAllRedirects: true,
    method: 'post',
    headers: {
      'Origin': 'https://www.crapeyewear.com',
      'User-Agent': userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://www.crapeyewear.com/products/' + match.handle,
      'Accept-Language': 'en-US,en;q=0.8'
    },
    formData: {
      'id': styleID,
      'qty': '1'
    }
  }, function(err, res, body) {
    request({
      url: 'https://www.crapeyewear.com/cart',
      followAllRedirects: true,
      method: 'get',
      headers: {
        'User-Agent': userAgent
      }
    }, function(err, res, body) {
      log('Added to cart!');
      log('Checking out your item!');
      request({
        url: 'https://www.crapeyewear.com/cart',
        followAllRedirects: true,
        method: 'post',
        headers: {
          'User-Agent': userAgent
        },
        formData: {
          'quantity': '1',
          'checkout': 'Checkout'
        }
      }, function(err, res, body) {

        var $ = cheerio.load(body);
        checkoutID = $('.edit_checkout').attr('action').split('checkouts/')[1];
        storeID = $('.edit_checkout').attr('action').split('/')[1];
        var auth_token = $('input[name=authenticity_token]').attr('value');
        log(`Store ID: ${storeID}`)
        log(`Checkout ID: ${checkoutID}`)
        return input(auth_token);
      });
    });
  });
}

function input(auth_token) {
  url = `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`
  log(`Checkout URL: https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`)
  request({
    url: `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
    followAllRedirects: true,
    headers: {
      'Origin': 'https://www.crapeyewear.com',
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://www.crapeyewear.com/',
      'Host': 'www.crapeyewear.com',
      'Accept-Language': 'en-US,en;q=0.8'
    },
    method: 'get',
    qs: {
      'utf8': '✓',
      '_method': 'patch',
      'authenticity_token': auth_token,
      'previous_step': 'contact_information',
      'checkout[email]': config.email,
      'checkout[shipping_address][first_name]': config.firstName,
      'checkout[shipping_address][last_name]': config.lastName,
      'checkout[shipping_address][company]': '',
      'checkout[shipping_address][address1]': config.address,
      'checkout[shipping_address][address2]': '',
      'checkout[shipping_address][city]': config.city,
      'checkout[shipping_address][country]': 'United States',
      'checkout[shipping_address][province]': config.state,
      'checkout[shipping_address][province]': '',
      'checkout[shipping_address][province]': states[config.state],
      'checkout[shipping_address][zip]': config.zipCode,
      'checkout[shipping_address][phone]': config.phoneNumber,
      'checkout[remember_me]': '',
      'checkout[remember_me]': '0',
      'checkout[client_details][browser_width]': '979',
      'checkout[client_details][browser_height]': '631',
      'checkout[client_details][javascript_enabled]': '1',
      'step': 'contact_information'
    }
  }, function(err, res, body) {
    var $ = cheerio.load(body);
    return ship($('input[name=authenticity_token]').attr('value'));
  });
}

function ship(auth_token) {
  request({
    url: `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
    followAllRedirects: true,
    method: 'post',
    headers: {
      'Origin': 'https://www.crapeyewear.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8',
      'Referer': `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
      'User-Agent': userAgent
    },
    formData: {
      'utf8': '✓',
      '_method': 'patch',
      'authenticity_token': auth_token,
      'button': '',
      'checkout[email]': config.email,
      'checkout[shipping_address][first_name]': config.firstName,
      'checkout[shipping_address][last_name]': config.lastName,
      'checkout[shipping_address][company]': '',
      'checkout[shipping_address][address1]': config.address,
      'checkout[shipping_address][address2]': '',
      'checkout[shipping_address][city]': config.city,
      'checkout[shipping_address][country]': 'United States',
      'checkout[shipping_address][province]': states[config.state],
      'checkout[shipping_address][zip]': config.zipCode,
      'checkout[shipping_address][phone]': phoneFormatter.format(config.phoneNumber, "(NNN) NNN-NNNN"),
      'checkout[remember_me]': '0',
      'checkout[client_details][browser_width]': '979',
      'checkout[client_details][browser_height]': '631',
      'checkout[client_details][javascript_enabled]': '1',
      'previous_step': 'contact_information',
      'step': 'shipping_method'
    }
  }, function(err, res, body) {

    var $ = cheerio.load(body);
    var auth_token = $('.edit_checkout input[name=authenticity_token]').attr('value');
    return submitShipping(auth_token);

  });
}

function submitShipping(auth_token) {
  log('Transfering Cookies over to headless session...');
  var cookies = JSON.stringify(j.getCookies('http://www.crapeyewear.com'));
  var parsedCookies = JSON.parse(cookies);
  log(`Number of Cookies discovered: ${parsedCookies.length}`)
  for (var i = 0; i < parsedCookies.length; i++) {
    if (parsedCookies[i].value === undefined) {
      var val = ''
    } else {
      var val = parsedCookies[i].value;
    }

    if (i != 7) {
      nightmareCookies.push({
        "url": 'http://www.crapeyewear.com',
        "name": parsedCookies[i].key,
        "value": val
      });
    }
  }

      var nm = Nightmare({
          show: false,
          openDevTools: {
            mode: 'detach'
          },
          typeInterval: 20,
          alwaysOnTop: false
      }).useragent(userAgent)
          .cookies.clearAll()
          .cookies.set(nightmareCookies);

          nm
            .goto(url)
            .insert('#checkout_email', config.email)
            .insert('#checkout_shipping_address_first_name', config.firstName)
            .insert('#checkout_shipping_address_last_name', config.lastName)
            .insert('#checkout_shipping_address_address1', config.address)
            .insert('#checkout_shipping_address_city', config.city)
            .select('#checkout_shipping_address_province', states[config.state])
            .insert('#checkout_shipping_address_zip', config.zipCode)
            .insert('#checkout_shipping_address_phone', config.phoneNumber)
            .click('.step__footer__continue-btn')
            .wait('.radio__input')
            .click('.step__footer__continue-btn')
            .then(function () {
                console.log('Card information sending...');
                request({
                  url: `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}?previous_step=shipping_method&step=payment_method`,
                  followAllRedirects: true,
                  method: 'get',
                  headers: {
                    'User-Agent': userAgent
                  }
                }, function(err, res, body) {
                  var $ = cheerio.load(body);
                  var auth_token = $('form[data-payment-form=""] input[name=authenticity_token]').attr('value');
                  var price = $('input[name="checkout[total_price]"]').attr('value');
                  var payment_gateway = $('input[name="checkout[payment_gateway]"]').attr('value');
                  log(auth_token)
                  log(`Price: ${price}`);
                  log(`Payment Gateway ID: ${payment_gateway}`);
                  submitCC(auth_token, price, payment_gateway);
                });
            }).catch(function (err) {
            console.log('error ', err);
          });
}

function submitCC(auth_token, price, payment_gateway) {
  request({
    url: `https://elb.deposit.shopifycs.com/sessions`,
    followAllRedirects: true,
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      'Content-Type': 'application/json'
    },
    json: {
      "credit_card": {
        "number": config.ccn,
        "name": config.firstName + ' ' + config.lastName,
        "month": config.month,
        "year": config.year
      }
    }
  }, function(err, res, body) {
    var sValue = body.id;
    request({
      url: `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
      followAllRedirects: true,
      method: 'post',
      headers: {
        'Origin': 'https://www.crapeyewear.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.8',
        'Referer': `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
        'User-Agent': userAgent
      },
      formData: {
        'utf8':'✓',
        '_method':'patch',
        'authenticity_token': auth_token,
        'previous_step': 'payment_method',
        'step': '',
        's': sValue,
        'checkout[payment_gateway]':payment_gateway,
        'checkout[credit_card][vault]':'false',
        'checkout[different_billing_address]':'false',
        'checkout[billing_address][first_name]': config.firstName,
        'checkout[billing_address][last_name]': config.lastName,
        'checkout[billing_address][company]': '',
        'checkout[billing_address][address1]':config.address,
        'checkout[billing_address][address2]': '',
        'checkout[billing_address][city]': config.city,
        'checkout[billing_address][country]':'United States',
        'checkout[billing_address][province]': states[config.state],
        'checkout[billing_address][zip]': config.zipCode,
        'checkout[billing_address][phone]': phoneFormatter.format(config.phoneNumber, "(NNN) NNN-NNNN"),
        'checkout[total_price]': price,
        'complete':'1',
        'checkout[client_details][browser_width]': '979',
        'checkout[client_details][browser_height]': '631',
        'checkout[client_details][javascript_enabled]': '1',
      }
    }, function(err, res, body) {
      if (dev) {
        fs.writeFile('test.html', body, function(err) {
          log('test.html saved');
        });
      }
    });
  });
}
