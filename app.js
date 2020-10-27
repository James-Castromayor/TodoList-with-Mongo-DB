//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js"); //global file
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//Create mongoose database, port 27017 depends on your mongod port
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});//useNewUrlParser does not show depracated functions

//Create a schema
const itemsSchema = {
  name: {
    type: String,
    required: true
  }
};

//Create a model, model are capitalised, collection is a single item, eventually it will be plural
const Item = mongoose.model("Item", itemsSchema);

//Create a new document
const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
})

const defaulItems = [ item1, item2, item3 ];

//Dynamic schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
//Dynamic model
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

//const day = date.getDate(); //uses

  //Find all database in Mongoose database, foundItems can be named into different name
  //Gives back an array
  Item.find({}, function (err, foundItems){
    //Check if items is 0
    if (foundItems.length === 0 ){
      //Insert items into item collection
      Item.insertMany (defaulItems, function(err){
        if (err){
          console.log(err);
        }
        else{
          console.log ("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    }

    res.render("list", {listTitle: "Today", newListItems: foundItems});
  });


});

app.post("/", function(req, res){

   const itemName = req.body.newItem; //gets the item in post route being input
   const listName = req.body.list;

   const item = new Item ({
     name: itemName
   })

   //Home Route
   if (listName === "Today")
   {
     item.save(); //insert single item
     res.redirect("/");
   }
   else{
     //search the list collection
     List.findOne({name: listName}, function(err, foundList){
       foundList.items.push(item); //push the item
       foundList.save(); //saving the item
       res.redirect("/" + listName);
     });
  }
  //
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post ("/delete", (req, res) =>{
  //Delete the checked item
  //console.log(req.body.checkbox);
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if ( listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err){
      if (!err) {
        console.log("Successfully deleted checked item");
      }
    });

    res.redirect("/");
  }
  else{
    //Find the list, pull remove all items with matching coondition
    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    })
  }

});

//Make a dynamic and custom get params
// app.get("/category/:<paramName>", function( req, res ) {
//   //Access req.params.paramName
// });
app.get("/:customListName", (req, res) => {
  //Apply lodash, make it capitalised
  const customListName = _.capitalize(req.params.customListName);

  //Check if the list is existing
  //Gives back an object, cannot check its length
  List.findOne ({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList) //Does not exist
      {
        //console.log("Does not exist");
        const list = new List ({
          name: customListName,
          items: defaulItems
        });
        list.save();
        res.render("list", {listTitle:list.name, newListItems: list.items});
      }
      else{
        //Show an existing list
        res.render("list", {listTitle:foundList.name, newListItems: foundList.items});
      }
    }
  })

})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
