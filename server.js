//adding dependencies
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

//pulling in our models
var db = require("./models");
//setting port equal to 3000, will probably have to change later for heroku integrate
var PORT = 3000;

var app = express();

// if we were going to use handlebars/middleware, I'd put it here, but I hate handlebars.
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

// Connecting to the Mongo DB-- will have to change this for chess scraper
mongoose.connect("mongodb://localhost/chessScraper", { useNewUrlParser: true });

// Routes

app.get("/scrape", function(req, res) {

  axios.get("https://www.chess.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("article").each(function(i, element) {
  
      var result = {};

      result.title = $(element).find('a').attr("title");
      result.link = $(element).find("a").attr("href");
      result.summary = $(element).find("p").text();
      console.log(result.summary);

      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {

  db.Article.find({})
    .then(function(dbArticle) {

      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});



// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
