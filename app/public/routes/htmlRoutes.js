const path = require('path');
const express = require('express');

module.exports = function(app) {
    app.use(express.static('./public'));

    app.get('/', function(req,res){
        res.sendFile(path.join(__dirname, "../public/index.html"));
    })
}