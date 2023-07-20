const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      // This checks if email is valid using npm package
      validate: [validator.isEmail, 'Please provide a valid email!'],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // THIS ONLY WORKS ON CREATE AND SAVE!!!!
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    // This is an instance method so it will be available on all docs of a collection
    methods: {
      // Checks whether user inputted password is same as password in database
      correctPassword(candidatePassword, userPassword) {
        // compares one hashed and one unhashed password by hashing them both
        return bcrypt.compare(candidatePassword, userPassword);
      },
      // Checks whether password was changed After
      changedPasswordAfter(JWTTimestamp) {
        // password changedat would only exist for a user if he changed pwd else return
        if (this.passwordChangedAt) {
          const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime(),
            10
          );
          // console.log(JWTTimestamp, Date.now());
          return JWTTimestamp * 1000 < changedTimestamp;
        }

        return false;
      },
      // Creates a token to reset password
      createPasswordResetToken() {
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Now hash this random string and store it as encrypted reset token
        this.passwordResetToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');

        // reset token expires in 10mins
        this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        return resetToken;
      },
    },
  }
);

// Use a pre document middleware on save to encrypt the passwords
userSchema.pre('save', async function (next) {
  // Only encrypt the password if it is changed or updated
  if (!this.isModified('password')) return next();

  // If password is updated then hash it
  // The second parameter is the salt length, no. of characters added to password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// // middleware to update changedPasswordAt property if password is changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query middleware to remove inactive users from list of all users
userSchema.pre(/^find/, function (next) {
  // this keyword points to current query
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
