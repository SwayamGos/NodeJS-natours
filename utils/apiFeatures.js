// Make a class for all API features so it is reusable

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // FILTERING:
    // Here, we need to remove the page, sort, limit and fields variable from our query object before we do anything, else they will be considered too

    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => {
      delete queryObj[el];
    });

    // console.log(this.queryString, queryObj, '\n');

    // Advanced Filtering:

    // This is how you write greater than equal queries:
    // { difficulty: 'easy', duration: { $gte: 2 }}

    // This is the query object given by req.query for such a req
    // { difficulty: 'easy', duration: { gte: '2' }}

    // To get the query string we just add $ sign to req.query object
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // This stores the queries filtered before sorting or anything else
    this.query.find(JSON.parse(queryStr));

    // Another way of querying:
    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    return this;
  }

  sort() {
    // SORTING:
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query.sort(`${sortBy}`);
    }
    // For descending, just use sort=-price in the url
    // For multiple criteria just do sort=price,ratingsAverage in the url
    return this;
  }

  limitFields() {
    // FIELD LIMITING:
    // For limiting fields, just do fields=name,duration,difficulty,price in the url

    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query.select(`${fields}`);
    } else {
      this.query.select(`-__v`);
      // Exclude a field like this
    }
    return this;
  }

  paginate() {
    // PAGINATION:
    // For pagination, just do page=2&limit=10 in the url
    // (2nd page when each page has 10 results)

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query.limit(limit).skip(skip);
    // console.log(skip, limit);

    return this;
  }
}
module.exports = APIFeatures;
