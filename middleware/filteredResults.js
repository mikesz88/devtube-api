const filteredResults = (model) => async (request, response, next) => { // curry function shorthand passing in another function with parameters
  let query;
  const reqQuery = { ...request.query };
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  console.log(queryStr);

  query = model.find(JSON.parse(queryStr));

  if (request.query.select) {
    const fields = request.query.select.split(',').join(' ');
    query = query.select(fields)
  }

  if (request.query.sort) {
    const sortBy = request.query.sort.split(',').join(' ');
    query = query.sort(sortBy)
  } else { // fallback sort to place latest entry first
    query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  const pagination = {};

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit }
  }

  if (startIndex > 0) {
    pagination.previous = { page: page - 1, limit }
  }

  const results = await query;

  response.filteredResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  }
  next();
};

module.exports = filteredResults;