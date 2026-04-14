const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const listSchema = new Schema({
 
  list: String,
  
});

const List = mongoose.model('List', listSchema);
module.exports = List;