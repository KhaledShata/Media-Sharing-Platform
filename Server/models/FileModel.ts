import mongoose, { Schema, Document } from 'mongoose';

// Define the schema for your file
interface IFile extends Document {
  gridfsId: mongoose.Schema.Types.ObjectId;
  numberOfLikes: number;
}

const FileSchema: Schema = new Schema({
  gridfsId: { type: Schema.Types.ObjectId, required: true },
  numberOfLikes: {
      type: Number,
      default: 0
  },
});

// Create the model from the schema
const MyFile = mongoose.model<IFile>('File', FileSchema);

export default MyFile;
