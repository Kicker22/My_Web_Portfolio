const express = require('express');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/app/public"));
require('./app/public/routes/htmlRoutes')(app)


app.listen(port, () => console.log(`listening on http://localhost:${port}`));




