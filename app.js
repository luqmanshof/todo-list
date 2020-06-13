//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongodb server connection
// mongoose.connect("mongodb://localhost:27017/todolistDB", { useUnifiedTopology: true, useNewUrlParser: true })
mongoose.connect("mongodb+srv://admin-luqman:Test-123@cluster0-4dj1t.mongodb.net/todolistDB?retryWrites=true&w=majority", { useUnifiedTopology: true, useNewUrlParser: true })

// create a new item schema
const itemsSchema = {
  name: String,
};

// create a new item model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "welcome to your todo list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
  Item.find({}, function (err, items) {

    if (items.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items succesfully!");
        }
      })

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });

    }
  });

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + customListName)
      } else {
        // Show an existing List
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }

  });

})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();

      res.redirect("/" + listName);
    });
  }

});


// app.get("/about", function (req, res) {
//   res.render("about");
// });

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({ _id: checkedItemId }, function (err) {
      if (!err) {
        console.log("Item succesfully removed");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })

  }

});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
