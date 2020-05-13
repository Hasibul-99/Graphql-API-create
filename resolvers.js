const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const createToken = (user, secret, expiresIn) => {
    const {username, email} = user;
    return jwt.sign({username, email}, secret, {expiresIn})
}

module.exports = {
    Query: {
        getCurrentUser: async (_, args, {User, currentUser}) => {
            if (!currentUser) {
                return null;
            };

            const user = await User.findOne({username: currentUser.username}).populate({
                path: "favorites",
                model: "Post"
            });

            return user;
        },

        getPosts: async (_, args, {Post}) => {
            const posts = await Post.find({}).sort({createdDate: "desc"}).populate({
                path: "createdBy",
                model: "User"
            });
            return posts;
        },

        getPost: async (_, {postId}, {Post}) => {
            const post = await Post.findOne({_id: postId}).populate({
                path: "messages.messageUser",
                model: "User"
            });

            return post;
        },

        infiniteScrollPosts: async (_, {pagenum, pageSize}, {Post}) => {
            let posts;

            if (pagenum === 1) {
                posts = await Post.find({}).sort({createdDate: 'desc'}).populate({
                    path: 'createdBy',
                    model: 'User'
                }).limit(pageSize);
            } else {
            // if page number is greater than one. figure out how many documnets to skip. 
                const  skips = pageSize * (pagenum -1);
                posts = await Post.find({}).sort({createdDate: 'desc'}).populate({
                    path: 'createdBy',
                    model: 'User'
                }).skip(skips).limit(pageSize);
            }

            const totalDocs = await Post.countDocuments();
            const hasMore = totalDocs > pageSize * pagenum;
            return {posts, hasMore};
        },

        searchPosts: async(_, {searchTerm}, { Post }) => {
            if (searchTerm) {
                const searchResult = await Post.find(
                    {$text: {$search: searchTerm}},
                    {score: {$meta: 'textScore'}}
                ).sort({
                    score: {$meta: 'textScore'},
                    likes: 'desc'
                }).limit(5);

                return searchResult;
            }
        },

        getUserPosts: async(_,{userId}, {Post}) => {
            if (userId) {
                const result = await Post.find({
                    createdBy: userId
                }).sort({
                    createdDate: 'desc'
                }).limit(5)

                return result;
            }
        }
    },

    Mutation: {
        signupUsers: async (_, {username, email, password}, {User}) => {
            const user = await User.findOne({username: username});

            if (user) {
                throw new Error('User already exists');
            };

            const newUser = await new User({
                username,
                email,
                password
            }).save();

            return {token: createToken(newUser, process.env.SECRET, '1hr')};
        },
        signinUser: async(_, {username, password}, {User}) => {
            const user = await User.findOne({username});

            if (!user) {
                throw new Error("User not found");
            }
             
            const isValiedPassword = await bcrypt.compare(password, user.password);

            if (!isValiedPassword) {
                throw new Error("Invalid password");
                
            }

            return {token: createToken(user, process.env.SECRET, '1hr')};
        },
        addpost: async (_, {title, imageUrl, categories, description, creatorId}, {Post}) => {
            const newPost = await new Post({
                title,
                imageUrl,
                categories,
                description,
                createdBy: creatorId
            }).save();

            return newPost;
        },
        addPostMessage: async (_, {messageBody, userId, postId}, {Post}) => {
            const newMessage = {
                messageBody,
                messageUser: userId
            };
            const post = await Post.findOneAndUpdate({_id: postId}, 
                {$push: {messages: {$each: [newMessage], $position: 0}}},
                {new: true}
                ).populate({
                    path: 'messages.messageUser',
                    model: 'User'
                });

            return post.messages[0];
        },

        likePost: async(_, {postId, username}, {Post, User}) => {
            // find POst ad 1 to its like value
            const post = await Post.findOneAndUpdate(
                { _id: postId },
                { $inc: {likes: 1}},
                {new: true}
            );

            // find User,   add id of post to its favorites array (whitch will be populated as posts)
            const user = await User.findOneAndUpdate(
                { username: username },
                { $addToSet: {favorites: postId} },
                { new : true }
            ).populate({
                path: 'favorites',
                model: 'Post'
            });

            // return only likes frompost and favorites from user
            return { likes: post.likes, favorites: user.favorites };
        },

        unlikePost: async(_, {postId, username}, {Post, User}) => {
            // find Post add -1 to its like value
            const post = await Post.findOneAndUpdate(
                { _id: postId },
                { $inc: {likes: -1}},
                {new: true}
            );

            // find User,   add id of post to its favorites array (whitch will be populated as posts)
            const user = await User.findOneAndUpdate(
                { username: username },
                { $pull: {favorites: postId} },
                { new : true }
            ).populate({
                path: 'favorites',
                model: 'Post'
            });

            // return only likes frompost and favorites from user
            return { likes: post.likes, favorites: user.favorites };
        }, 
    }
}