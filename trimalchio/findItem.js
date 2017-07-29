const fs = require('fs');
const _ = require('underscore');

const j = require('request').jar();
const request = require('request').defaults({
  timeout: 10000,
  jar: j,
});

const prompt = require('../utils/prompt');
const log = require('../utils/log');

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';
let match;
let userHasBeenNotifiedEmpty = false;

module.exports = {};

function findItem(config, slackBot, proxy, cb) {
  if (config.base_url.endsWith('.xml')) {
    const parseString = require('xml2js').parseString;

    request(
      {
        url: config.base_url,
        method: 'get',
        headers: {
          'User-Agent': userAgent,
        },
        proxy: proxy,
      },
      function(err, res, body) {
        parseString(body, function(err, result) {
          if (err) {
            log(
              'An error occured while trying to parse the sitemap provided',
              'error'
            );
            process.exit(1);
          }
          log('result.length ' + result.length);
          if (process.env.DEBUG) {
            fs.writeFile('debug.html', result, function(err) {
              if (err) {
                log(err, 'error');
              }
              log(
                'The file debug.html was saved the root of the project file.'
              );
            });
          }
        });
      }
    );
  } else {
    log('non xml shit');
    request(
      {
        url: `${config.base_url}/products.json`,
        method: 'get',
        headers: {
          'User-Agent': userAgent,
        },
        proxy: proxy,
      },
      function(err, res, body) {
        if (err) {
          log(err);
          return cb(err, null);
        } else {
          try {
            const products = JSON.parse(body);

            const foundItems = [];

            if (products.products.length === 0) {
              if (userHasBeenNotifiedEmpty) {
                return cb(true, null);
              } else {
                userHasBeenNotifiedEmpty = true;
                log("No item's available right now still looking...", 'error');
                return cb(true, null);
              }
            }

            for (let i = 0; i < config.keywords.length; i++) {
              for (let x = 0; x < products.products.length; x++) {
                const name = products.products[x].title;
                if (
                  name.toLowerCase().indexOf(config.keywords[i].toLowerCase()) >
                  -1
                ) {
                  foundItems.push(products.products[x]);
                }
              }
            }

            if (foundItems.length > 0) {
              if (foundItems.length === 1) {
                log(`Item Found! - "${foundItems[0].title}"`);
                match = foundItems[0];
                return cb(null, foundItems[0]);
              } else {
                log(
                  `We found more than 1 item matching with the keyword(s) please select the item.\n`,
                  'warning'
                );

                for (let j = 0; j < foundItems.length; j++) {
                  log(`Product Choice #${j + 1}: "${foundItems[j].title}"`);
                }

                prompt.get(
                  [
                    {
                      name: 'productSelect',
                      required: true,
                      description: 'Select a Product # (ex: "2")',
                    },
                  ],
                  function(err, result) {
                    const choice = parseInt(result.productSelect);
                    match = foundItems[choice - 1];
                    log(`You selected - "${match.title}`);
                    return cb(null, match);
                  }
                );
              }
            } else {
              return cb('Match not found yet...', null);
            }
          } catch (e) {
            if (res.statusCode == 430) {
              log(
                `Shopify has timed out your connection temporally due to excessive traffic coming from your host.`,
                'error'
              );
              process.exit(1);
            } else {
              log(
                `This site is incompatible, sorry for the inconvenience.`,
                'error'
              );
              process.exit(1);
            }
          }
        }
      }
    );
  }
}

module.exports.findItem = findItem;

const findvariantstock = function(config, slackBot, handle, id, cb) {
  request(
    {
      url: `${config.base_url}/products/` + handle + '.json',
      followAllRedirects: true,
      method: 'get',
      headers: {
        'User-Agent': userAgent,
      },
    },
    function(err, res, body) {
      try {
        const variants = JSON.parse(body).product.variants;

        const constiant = _.findWhere(variants, {
          id: id,
        });
        if (constiant.inventory_quantity) {
          return cb(null, constiant.inventory_quantity);
        } else {
          return cb(null, 'Unavailable');
        }
      } catch (e) {
        return cb(true, null);
      }
    }
  );
};

function selectStyle(config, slackBot, res, onSuccess) {
  let stock;
  let styleID;
  if (match.variants.length === 1) {
    styleID = match.variants[0].id;

    if (config.show_stock == false) {
      stock = 'Disabled';
    } else {
      findvariantstock(
        config,
        slackBot,
        match.handle,
        match.variants[0].id,
        function(err, res) {
          if (err) {
            log(
              `Style Selected: "${match.variants[0]
                .option1}" (${styleID}) | Stock: Unavailable`
            );
            onSuccess(match, styleID);
          } else {
            log(
              `Style Selected: "${match.variants[0]
                .option1}" (${styleID}) | Stock: ${res}`
            );
            onSuccess(match, styleID);
          }
        }
      );
    }
  } else {
    for (let i = 0; i < match.variants.length; i++) {
      const styleName = match.variants[i].option1;
      const option2 = match.variants[i].option2;

      if (config.show_stock == false) {
        stock = 'Disabled';
      } else {
        findvariantstock(match.handle, match.variants[i].id, function(
          err,
          res
        ) {
          if (err) {
            stock = 'Unavailable';
          } else {
            stock = res;
          }
        });
      }

      if (option2 == null) {
        log(`Style/Size Choice #${i + 1}: "${styleName}" | Stock: (${stock})`);
      } else {
        log(
          `Style/Size Choice #${i +
            1}: "${styleName}" - ${option2} | Stock: (${stock}`
        );
      }
    }

    if (config.slack.active) {
      const styleoptions = [];
      for (let j = 0; j < match.variants.length; j++) {
        styleoptions.push({
          name: match.variants[j].option1,
          text: match.variants[j].option1,
          type: 'button',
          value: match.variants[j].id,
        });
      }

      const params = {
        text: 'Item Found! Select a Style...',
        callback_id: 'stylePick',
        attachments: [
          {
            title: match.title,
            author_name: 'Trimalchio',
            image_url: match.images[0].src,
            author_icon: config.slack.settings.icon_url,
          },
          {
            text: 'Select a Style...',
            fallback: 'Unable to choose a style',
            callback_id: 'style',
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: styleoptions,
          },
        ],
      };
      slackBot.postMessage(config.slack.channel, null, params);
    }

    prompt.get(
      [
        {
          name: 'styleSelect',
          required: true,
          description: 'Select a Style # (ex: "1")',
        },
      ],
      function(err, result) {
        // Check if they have a second option open
        const choice = parseInt(result.styleSelect);
        styleID = match.variants[choice - 1].id;
        log(
          `You selected - "${match.variants[choice - 1].option1}" (${styleID})`
        );
        onSuccess(match, styleID);
      }
    );
  }
}

module.exports.selectStyle = selectStyle;
