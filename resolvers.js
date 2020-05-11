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
                path: "massages.massageUser",
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
        }
    }
}