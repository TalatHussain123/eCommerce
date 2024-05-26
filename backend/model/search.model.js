import mongoose from 'mongoose';

const searchHistorySchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.ObjectId,
            ref: 'User',
            required: true
        },
        query: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model('SearchHistory', searchHistorySchema);
