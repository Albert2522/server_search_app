const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const craigs = require('node-craigslist');
const imgrab = require('imagegrab');
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

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
