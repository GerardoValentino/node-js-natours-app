import mongoose, { Query } from "mongoose";
import slugify from "slugify";
// import validator from 'validator';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal 40 characters"],
      minlength: [10, "A tour name must have more or equal 10 characters"],
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value: number) {
          // this only points to the current doc on NEW document creation
          return value < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: Only runs before .save() and .create() .
// We can define multiple document middleware**

tourSchema.pre("save", function () {
  // In DOCUMENT MIDDLEWARE the "this" keyword points to the current document

  this.slug = slugify(this.name, { lower: true });
});

// QUERY MIDDLEWARE

//tourSchema.pre('find', function() {
tourSchema.pre(/^find/, function (this: Query<unknown, unknown>) {
  // In QUERY MIDDLEWARE the "this" keyword points to the current query
  this.find({ secretTour: { $ne: true } });
});

// This middleware will run after the query has been executed
// tourSchema.post(/^find/, function(docs) {
//   console.log(docs);
// })

// AGGREGATION MIDDLEWARE
tourSchema.pre("aggregate", function () {
  // In AGGREGATION MIDDLEWARE the "this" keyword points to the current aggregation

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  // console.log(this.pipeline());
});

export const Tour = mongoose.model("Tour", tourSchema);
