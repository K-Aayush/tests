/**
 * Base Fetcher class for retrieving domain objects
 * Implements the Fetcher pattern for consistent data retrieval
 */
class BaseFetcher {
  constructor(modelName, prismaModel) {
    this.modelName = modelName;
    this.prismaModel = prismaModel;
    this.whereClause = {};
    this.includes = {};
    this.orderBy = {};
    this.pagination = {};
    this.selectFields = null;
  }

  /**
   * Set where conditions
   * @param {Object} conditions - Where conditions
   * @returns {BaseFetcher}
   */
  where(conditions) {
    this.whereClause = { ...this.whereClause, ...conditions };
    return this;
  }

  /**
   * Set includes for relations
   * @param {Object} includes - Relations to include
   * @returns {BaseFetcher}
   */
  include(includes) {
    this.includes = { ...this.includes, ...includes };
    return this;
  }

  /**
   * Set select fields
   * @param {Object} fields - Fields to select
   * @returns {BaseFetcher}
   */
  select(fields) {
    this.selectFields = fields;
    return this;
  }

  /**
   * Set ordering
   * @param {Object} order - Order by conditions
   * @returns {BaseFetcher}
   */
  orderBy(order) {
    this.orderBy = order;
    return this;
  }

  /**
   * Set pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {BaseFetcher}
   */
  paginate(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    this.pagination = { skip, take: limit, page, limit };
    return this;
  }

  /**
   * Add soft delete filter (exclude deleted records)
   * @returns {BaseFetcher}
   */
  excludeDeleted() {
    this.whereClause.deletedAt = null;
    return this;
  }

  /**
   * Add search functionality
   * @param {string} searchTerm - Search term
   * @param {Array<string>} searchFields - Fields to search in
   * @returns {BaseFetcher}
   */
  search(searchTerm, searchFields = []) {
    if (searchTerm && searchFields.length > 0) {
      this.whereClause.OR = searchFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      }));
    }
    return this;
  }

  /**
   * Add date range filter
   * @param {string} field - Date field name
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {BaseFetcher}
   */
  dateRange(field, startDate, endDate) {
    if (startDate && endDate) {
      this.whereClause[field] = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      this.whereClause[field] = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      this.whereClause[field] = {
        lte: new Date(endDate),
      };
    }
    return this;
  }

  /**
   * Find a single record by ID
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const query = {
      where: { id, ...this.whereClause },
    };

    if (Object.keys(this.includes).length > 0) {
      query.include = this.includes;
    }

    if (this.selectFields) {
      query.select = this.selectFields;
    }

    return await this.prismaModel.findFirst(query);
  }

  /**
   * Find a single record by external ID
   * @param {string} externalId - External ID
   * @returns {Promise<Object|null>}
   */
  async findByExternalId(externalId) {
    const query = {
      where: { externalId, ...this.whereClause },
    };

    if (Object.keys(this.includes).length > 0) {
      query.include = this.includes;
    }

    if (this.selectFields) {
      query.select = this.selectFields;
    }

    return await this.prismaModel.findFirst(query);
  }

  /**
   * Find first record matching conditions
   * @returns {Promise<Object|null>}
   */
  async findFirst() {
    const query = {
      where: this.whereClause,
    };

    if (Object.keys(this.includes).length > 0) {
      query.include = this.includes;
    }

    if (this.selectFields) {
      query.select = this.selectFields;
    }

    if (Object.keys(this.orderBy).length > 0) {
      query.orderBy = this.orderBy;
    }

    return await this.prismaModel.findFirst(query);
  }

  /**
   * Find many records with pagination
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async findMany() {
    const query = {
      where: this.whereClause,
    };

    if (Object.keys(this.includes).length > 0) {
      query.include = this.includes;
    }

    if (this.selectFields) {
      query.select = this.selectFields;
    }

    if (Object.keys(this.orderBy).length > 0) {
      query.orderBy = this.orderBy;
    }

    if (this.pagination.skip !== undefined) {
      query.skip = this.pagination.skip;
      query.take = this.pagination.take;
    }

    const [data, total] = await Promise.all([
      this.prismaModel.findMany(query),
      this.prismaModel.count({ where: this.whereClause }),
    ]);

    const pagination = this.pagination.page
      ? {
          page: this.pagination.page,
          limit: this.pagination.limit,
          total,
          pages: Math.ceil(total / this.pagination.limit),
        }
      : null;

    return { data, pagination };
  }

  /**
   * Count records matching conditions
   * @returns {Promise<number>}
   */
  async count() {
    return await this.prismaModel.count({
      where: this.whereClause,
    });
  }

  /**
   * Reset the fetcher to initial state
   * @returns {BaseFetcher}
   */
  reset() {
    this.whereClause = {};
    this.includes = {};
    this.orderBy = {};
    this.pagination = {};
    this.selectFields = null;
    return this;
  }
}

module.exports = BaseFetcher;
