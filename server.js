const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const craigs = require('node-craigslist');
const imgrab = require('imagegrab');
const ebay = require('ebay-api');
const AWS = require('aws-sdk');


const sendResponseCraigs = (response, listings) => {
  let final_response = [ ];
  listings.map(listing => {
    let tmp = listing;
    imgrab(listing.url, url => {
      if (listing.hasPic) {
        tmp.image_url = url[0];
      } else {
        tmp.image_url = '';
      }
      final_response.push(tmp);
      if (final_response.length == listings.length) {
        response.send(final_response);
      }
    });
  });
};

const ebayImageUrlPars = (array_url) => {
  array_url.forEach( url => {
    if (url.includes('s-l300.jpg')) {
      return url;
    }
  })
  return "";
};

app.get('/craigslist', (request, response) => {
  let query = request.query;
  let user_city = query.city ? query.city : 'sfbay'
  client = new craigs.Client({
    city : user_city
  });
  let options = {maxAsk: query.maxAsk, minAsk: query.minAsk};
  if (query.search) {
    client.search(options, query.search).then(listings => sendResponseCraigs(response, listings));
  } else {
    client.list().then(listings => sendResponseCraigs(response, listings));
  }
});

app.get('/ebay', (request, response) => {
      let keys  = request.query.search? request.query.search.split(" ") : "car";
      var params = {
        keywords: keys,

        // add additional fields
        outputSelector: ['AspectHistogram'],

        paginationInput: {
          entriesPerPage: 120
        }
      };

      ebay.xmlRequest({
          serviceName: 'Finding',
          opType: 'findItemsByKeywords',
          appId: 'AlbertAb-simplese-PRD-e090738eb-8c1e10ef',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
          params: params,
          parser: ebay.parseResponseJson    // (default)
        },
        // gets all the items together in a merged array
        function itemsCallback(error, itemsResponse) {
          if (error) throw error;

          console.log(itemsResponse);
          var items = itemsResponse.searchResult.item;
          let final_response = [ ];
          items.map( item => {
            let tmp = {};
            tmp.category = item.primaryCategory.categoryName;
            tmp.date = item.listingInfo.endTime;
            tmp.hasPick = item.galleryURL ? true : false;
            tmp.pid = item.itemId;
            tmp.location = item.location;
            tmp.price = item.sellingStatus.currentPrice.amount;
            tmp.title = item.title;
            tmp.url = item.viewItemURL;
            tmp.image_url = item.galleryURL;
            final_response.push(tmp);
          });
          response.send(final_response);
        }
      );
});

app.get('/amazon', (request, response) => {
  console.log("here");
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
