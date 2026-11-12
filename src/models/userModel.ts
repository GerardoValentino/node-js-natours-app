import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name!"],
      trim: true,
      maxlength: [20, "A tour name must have less or equal 20 characters"],
      minlength: [3, "A user name must have more or equal 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      trim: true,
      lowercase: true,
      unique: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Your must have a password"],
      trim: true,
      select: false,
      minlength: [9, "A password must have more or equal 9 characters"],
    },
    passwordConfirm: {
      type: String,
      required: [true, "You must confirm your password"],
      trim: true,
      validate: {
        // This only works on CREATE and SAVE!!
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same!",
      },
    },
    passwordChangedAt: Date,
    photo: {
      type: String,
      trim: true,
    },
  },
  {
    methods: {
      async correctPassword(candidatePassword: string, userPassword: string) {
        return await bcrypt.compare(candidatePassword, userPassword);
      },

      changePasswordAfter(JWTTimestamp: number): boolean {
        const { passwordChangedAt } = this as unknown as {
          passwordChangedAt?: Date | null;
        };

        if (passwordChangedAt) {
          const changedTimestamp = Math.floor(passwordChangedAt.getTime() / 1000);
          return JWTTimestamp < changedTimestamp;
        }

        return false;
      },
    },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.set("passwordConfirm", undefined);
});

export const User = mongoose.model("User", userSchema);
