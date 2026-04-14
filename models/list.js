const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const listSchema = new Schema({
 
  list: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
  
});

const List = mongoose.model('List', listSchema);
module.exports = List;
