const StoryPost = require('../models/StoryPost');
const User = require('../models/User');
const Post = require('../models/Post');
const PhotoGallery = require('../models/PhotoGallery');


const introStory = async (req, res) => {
    console.log('introStory called',req.user._id,req.body);
    try {
        const { profileQuote, personalDescription, tags } = req.body;
        
        const user = await User.findById(req.user._id);
        
        user.introStory = {
            profileQuote,
            personalDescription,
            tags
        };
        
        await user.save();
        
        res.json(user.introStory);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    };

 const StoryPosts = async (req, res) => {
    console.log('StoryPosts called',req.user._id,req.body);
    try {
        const { title, caption, imageUri, moodTag } = req.body;


        
        const newStory = new StoryPost({
            userId: req.user._id,
            title,
            caption,
            imageUri,
            moodTag
        });
        
        const story = await newStory.save();
        
        // Add to user's storyPosts array
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { storyPosts: story._id } }
        );
        
        res.json(story);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
 }   

const updateStoryPost = async (req, res) => {
    console.log('updateStoryPost called',req.params.id,req.body);
    try {
        const { title, caption, imageUri, moodTag } = req.body;
        
        const story = await StoryPost.findByIdAndUpdate(
            req.params.id,
            { title, caption, imageUri, moodTag },
            { new: true }
        );
        
        res.json(story);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const deleteStoryPost = async (req, res) => {
    console.log('deleteStoryPost called',req.params.id);
    try {
        const story = await StoryPost.findByIdAndDelete(req.params.id);
        
        res.json(story);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

 const profileDetails = async (req, res) => {
    console.log('profileDetails called',req.params.id);
    try {
        const user = await User.findById(req.params.id)
            .select('-password -responses')
            .populate('storyPosts')
            .populate('photoGallery');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // console.log('userrrrrr',user);
        
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
 }



/**
 * Upload a photo to user's gallery
 * @route POST /api/uploadGalleryPhoto
 * @access Private
 */
const uploadGalleryPhoto = async (req, res) => {
    console.log('uploadGalleryPhoto called', req.user._id, req.body);
    try {
        const { imageUrl, description, title } = req.body;
        
        // Check if user already has a gallery
        let gallery = await PhotoGallery.findOne({ userId: req.user._id });
        
        if (!gallery) {
            // Create new gallery if it doesn't exist
            gallery = new PhotoGallery({
                userId: req.user._id,
                photos: []
            });
        }
        
        // Add new photo to the photos array
        gallery.photos.push({
            id: Date.now().toString(), // Generate unique ID
            uri: imageUrl,
            description: description || '',
            createdAt: new Date()
        });
        
        // Save the updated gallery
        await gallery.save();

        // Add to user's photoGallery array
        const user = await User.findById(
            req.user._id 
        );

        if(user.photoGallery.length === 0) {
         
            user.photoGallery = [gallery._id]; 
           user.save();
        }
        
        // Return the newly added photo
        const newPhoto = gallery.photos[gallery.photos.length - 1];
        res.json(newPhoto);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Get user's gallery photos
 * @route GET /api/getUserGallery/:userId
 * @access Public
 */
const getUserGallery = async (req, res) => {
    console.log('getUserGallery called', req.params.userId);
    try {
        // Find the gallery for this user
        const gallery = await PhotoGallery.findOne({ userId: req.params.userId });
        
        if (!gallery) {
            return res.json([]);
        }
        
        // Sort photos by createdAt date (newest first)
        const sortedPhotos = gallery.photos.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        res.json(sortedPhotos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Delete a photo from user's gallery
 * @route DELETE /api/deleteGalleryPhoto/:photoId
 * @access Private
 */
const deleteGalleryPhoto = async (req, res) => {
    console.log('deleteGalleryPhoto called', req.params.photoId);
    try {
        // Find the gallery for this user
        const gallery = await PhotoGallery.findOne({ userId: req.user._id });
        
        if (!gallery) {
            return res.status(404).json({ msg: 'Gallery not found' });
        }
        
        // Check if photo exists
        const photoIndex = gallery.photos.findIndex(photo => photo.id === req.params.photoId);
        
        if (photoIndex === -1) {
            return res.status(404).json({ msg: 'Photo not found' });
        }
        
        // Remove the photo from the array
        gallery.photos.splice(photoIndex, 1);
        
        // Save the updated gallery
        await gallery.save();
        
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};




module.exports = {
    introStory,
    StoryPosts,
    profileDetails,
    uploadGalleryPhoto,
    getUserGallery,
    deleteGalleryPhoto,
    updateStoryPost,
    deleteStoryPost
}