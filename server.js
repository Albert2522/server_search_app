const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const craigs = require('node-craigslist');
const imgrab = require('imagegrab');
const ebay = require('ebay-api');
const AWS = require('aws-sdk');
const amazon = require('amazon-product-api');
const util = require('util');


const amazon_client = amazon.createClient({
  awsId: process.env.AWS_ACCESS_KEY,
  awsSecret:  process.env.AWS_SECRET_KEY,
  awsTag: process.env.AWS_ASSOCIATE_TAG
});



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
          var items = itemsResponse.searchResult.item;
          let final_response = [ ];
          items.map( item => {
            let tmp = {};
            tmp.category = item.primaryCategory.categoryName;
            tmp.date = item.listingInfo.endTime;
            tmp.hasPic = item.galleryURL ? true : false;
            tmp.pid = item.itemId;
            tmp.location = item.location;
            tmp.price = '$' + item.sellingStatus.currentPrice.amount;
            if (tmp.price.slice(-3) == '.00') {
              tmp.price = tmp.price.slice(0, -3);
            }
            tmp.title = item.title;
            tmp.url = item.viewItemURL.substring(0, 4) + 's' + item.viewItemURL.substring(4);
            if (tmp.hasPic && tmp.image_url != 'http://thumbs1.ebaystatic.com/pict/04040_0.jpg') {
              tmp.image_url = item.galleryURL.substring(0, 4) + 's' + item.galleryURL.substring(4);
            } else {
              tmp.image_url = "https://res.cloudinary.com/dd40qyh43/image/upload/v1493008173/no_image_search_wncg0a.png"
            }
            final_response.push(tmp);
          });
          response.send(final_response);
        }
      );
});

app.get('/amazon', (request, response) => {
  let search = request.query.search;
  if (typeof search === 'undefined') { search = 'mustang'; }
  console.log(search);
  let final_response = [ ];
  amazon_client.itemSearch({
    keywords: search,
    responseGroup: 'ItemAttributes, Images, Small, ItemIds'
  }).then(function(results){
    results.map( item => {
      let tmp = {};
      tmp.category = item.ItemAttributes[0].ProductTypeName[0];
      tmp.date = '';
      tmp.hasPic = item.LargeImage[0].URL[0] ? true : false;
      tmp.pid = item.ASIN[0];
      tmp.location = '';
      if (typeof item.ItemAttributes[0].ListPrice === 'undefined') { tmp.price = item.ItemAttributes[0].ListPrice; }
      else { tmp.price = item.ItemAttributes[0].ListPrice[0].FormattedPrice[0];}
      tmp.title = item.ItemAttributes[0].ProductGroup[0] + ': ' + item.ItemAttributes[0].Title[0];
      tmp.url = item.DetailPageURL[0];
      tmp.image_url = item.LargeImage[0].URL[0];
      final_response.push(tmp);
    });
    response.send(final_response);
  }).catch(function(err){
    console.log('problem');
    console.log(util.inspect(err, false, null));
  });
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
