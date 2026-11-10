import type { Query } from "mongoose";
import type { ParsedQs } from "qs";

export class APIFeatures<T> {
  constructor(
    public query: Query<T[], T>,
    private queryString: ParsedQs
  ) {}

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    const sort = this.queryString.sort;
    const sortBy = typeof sort === "string" ? sort.split(",").join(" ") : "-createdAt";
    this.query = this.query.sort(sortBy);

    return this;
  }

  limitFields() {
    const fields = this.queryString.fields;
    this.query = this.query.select(
        typeof fields === "string" ? fields.split(",").join(" ") : "-__v",
    );

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    this.query = this.query.skip((page - 1) * limit).limit(limit);

    return this;
  }
}
