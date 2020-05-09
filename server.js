const {ApolloServer} = require("apollo-server");
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// The GraphQL schema
const filePath = path.join(__dirname, 'typeDefs.gql');
const typeDefs = fs.readFileSync(filePath, 'utf-8');
const resolvers = require("./resolvers");

//Import enveroment variables and mongoose models
require('dotenv').config({path: 'variables.env'});
const User = require("./models/User");
const Post = require("./models/Post");

// comment mongoose db
mongoose.connect(process.env.MONGO_URI, 
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, })
.then(() => console.log("DB connected"))
.catch(err => console.error(err));

// Create Apollo/Graphql Server using typeDefs, resolvers and context object
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: {
        User,
        Post
    }
});

server.listen(4500).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});