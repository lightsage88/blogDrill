'use strict';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const commentSchema = mongoose.Schema({
    content: 'string'
});

const authorSchema = mongoose.Schema({
    firstName: 'string',
    lastName: 'string',
    userName: {
        type: 'string',
        unique: true
    }
});

const blogSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String},
  
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'Author'},
    created: {type: Date, default: Date.now},
    comments: [commentSchema]

});

blogSchema.pre('find', function(next){
    this.populate('author');
    next();
});

blogSchema.pre('findOne', function(next){
    this.populate('author');
    next();
});

blogSchema.pre('findByIdAndUpdate', function(next){
    this.populate('author');
    next();
});

authorSchema.pre('findByIdAndUpdate', function(next){
    this.populate('userName');
    next();
});
 

blogSchema.virtual('authorName').get(function() {
    console.log(this.author);
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.methods.serialize = function(){
    return {
        id: this._id,
        title: this.title,
        content: this.content,
        author: this.authorName,
        created: this.created,
        comments: this.comments
    }
};



const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('Blogpost', blogSchema);
const Comment = mongoose.model('Comment', commentSchema);
module.exports = {Author, BlogPost, Comment};