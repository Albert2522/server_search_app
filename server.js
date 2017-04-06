const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const craigs = require('node-craigslist');

client = new craigs.Client({
    city : 'sfbay'
  });

app.get('/craigslist', (request, response) => {
  response.send({HERE: "here"});
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
