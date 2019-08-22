'use strict';
const mongoose = require('mongoose');
const express = require('express');
const morgan = require('morgan');

const {Author, BlogPost} = require('./models');
const {PORT, DATABASE_URL} = require('./config');

mongoose.Promise = global.Promise;
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
const app = express();
app.use(morgan('common'));
app.use(express.json());
 

 
app.get('/posts', (req, res)=>{
    BlogPost
    .find()
    .then(posts => {
        console.log(posts);
        res.json(posts.map( post => post.serialize()));
    })
    .catch(
        err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error'});
        });
});  

app.get('/posts/:id', (req,res)=>{
    BlogPost
    .findById(req.params.id)
       
    .then(post =>  res.json(post.serialize()))
    .catch( err => {
        console.error(err);
        res.status(500).json({message: "some bullshit went down"});
    });
});

app.post('/posts', (req,res)=>{

    const requiredFields = ['title', 'content', 'author_id'];
    for(let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if(!(field in req.body)) {
            const message = `Missing ${field} in request`;
            console.error(message);
            return res.status(400).send(message);
        }
    }
 
    Author
    .findById(req.body.author_id)
    .then(author => {
        if(author) {
            BlogPost
            .create({
                title: req.body.title,
                content: req.body.content,
                author,
                created: req.body.created
            })
            .then(blogPost => res.status(201).json(blogPost.serialize()))
            .catch(err => {
                console.error(err);
                res.status(500).json({error: 'Something went wrong'});
            })
        } 

    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'author not found'});
    })

    
    
});

app.put('/posts/:id', (req, res)=>{
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = (
            `Request path id ${req.params.id} and request path id ${req.body.id} must match`
        );
        console.error(message);
        return res.status(400).json({message: message});
    }

    const toUpdate = {};
    const updateableFields = ['title', 'content'];
    updateableFields.forEach(field => {
        if(field in req.body) {
            toUpdate[field] = req.body[field]
        }
    }); 

    BlogPost
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(updatedPost => {
      return res.status(200).json({
          id: updatedPost.id,
          title: updatedPost.title,
          content: updatedPost.content,
      })
    
    })

    .catch(err => res.status(500).json({message: "Internal fuckup"}));
}); 

app.delete('/posts/:id', (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id ===req.body.id)) {
        const message = (
            `ID for deletion from params: ${req.params.id} and id for deletion from body ${req.body.id} should be the same!`
        );
        console.error(message);
        return res.status(500).json(message);
    }

    BlogPost
    .findByIdAndRemove(req.params.id)
    .then(()=> res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));

});

app.post('/authors', (req,res)=>{
    const requiredFields = ['firstName', 'lastName', 'userName'];
    for(let i = 0; i<requiredFields.length; i++) {
        let field = requiredFields[i];
        if(!(field in req.body)) {
            return res.status(400).json({message: `Missing field ${field} in request body`});
        }
    }

    let {firstName, lastName, userName} = req.body;

    Author
    .create({
        firstName,
        lastName,
        userName
    })
    .then(author => res.status(201).json(author))
    .catch(err => {
        console.error(err);
        res.status(400).json(err);
    })
})

app.put('/authors/:id', (req,res)=>{
    if(!(req.params.id && req.body.id && req.params.id ===req.body.id)) {
        return res.status(400).json({message: `The id-value from the params: ${req.params.id} and the id-value from the body: ${req.body.id} must match and currently do not}`});
    }

    const toUpdate = {};
    const updateableFields = ['lastName', 'firstName', 'userName'];
    updateableFields.forEach(field => {
        if(field in req.body) {
            toUpdate[field] = req.body[field]
        }
    }); 

    Author
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(updatedAuthor => {
      return res.status(200).json({
          id: updatedAuthor.id,
          name: updatedAuthor.authorName,
          userName: updatedAuthor.userName
      })
    
    })

    .catch(err => res.status(500).json({message: "Internal fuckup"}));

})

app.delete('/authors/:id', (req,res)=>{
    if(!(req.params.id && req.body.id && req.params.id ===req.body.id)) {
        return res.status(400).json({message: `The id-value from the params: ${req.params.id} and the id-value from the body: ${req.body.id} must match and currently do not}`});
    }
    Author
    .findByIdAndRemove(req.body.id)
    .then(()=> res.status(204).json({message: 'Deleted Author'}).end())
    .catch(err => res.status(500).json({message: "Internal Fuckup"}));
})

let server;

function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject)=> {
        mongoose.connect(databaseUrl, err => {
            if(err) {
                return reject(err);
            }

            server = app.listen(port, ()=> {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {runServer, app};