require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { connectDB } = require('./config/dbConnect');

const updateTheme = async () => {
    try {
        await connectDB();
        // Find by username 'adam-carter' and update theme to 12
        const user = await User.findOneAndUpdate(
            { username: 'adam-carter' },
            { theme: 12 },
            { new: true }
        );

        if (user) {
            console.log(`Successfully updated user ${user.username} theme to ${user.theme}`);
        } else {
            console.log('User adam-carter not found in the database.');
        }

    } catch (err) {
        console.error("Error updating user theme:", err);
    } finally {
        // Close the connection
        try {
            await mongoose.connection.close();
            console.log("Connection closed");
        } catch (e) {
            console.log("Error closing connection", e);
        }
        process.exit(0);
    }
};

updateTheme();
