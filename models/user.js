import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isMember: { type: Boolean, default: false },
});

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;