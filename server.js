const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const craigs = require('node-craigslist');


app.get('/craigslist', (request, response) => {
  let query = request.query;
  let user_city = query.city ? query.city : 'sfbay'
  client = new craigs.Client({
    city : user_city
  });
  console.log(user_city);
  let options = {maxAsk: query.maxAsk, minAsk: query.minAsk};
  if (query.search) {
    client.search(options, query.search).then(listings => response.send(listings));
  } else {
    client.list().then(listings => response.send(listings));
  }
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
