const BaseBuilder = require("./BaseBuilder");
const BaseFetcher = require("./BaseFetcher");

/**
 * Base Service class that combines Builder and Fetcher patterns
 * Provides common CRUD operations for all domain models
 */
class BaseService {
  constructor(modelName, prismaModel, prisma) {
    this.modelName = modelName;
    this.prismaModel = prismaModel;
    this.prisma = prisma;
  }

  /**
   * Create a new builder instance
   * @returns {BaseBuilder}
   */
  createBuilder() {
    return new BaseBuilder(this.modelName, this.prismaModel);
  }

  /**
   * Create a new fetcher instance
   * @returns {BaseFetcher}
   */
  createFetcher() {
    return new BaseFetcher(this.modelName, this.prismaModel);
  }

  /**
   * Generic create method
   * @param {Object} data - Data to create
   * @param {Object} options - Additional options (validation, includes, etc.)
   * @returns {Promise<Object>}
   */
  async create(data, options = {}) {
    const builder = this.createBuilder().withData(data);

    if (options.validation) {
      builder.withValidation(options.validation);
    }

    if (options.includes) {
      builder.withIncludes(options.includes);
    }

    if (options.externalIdPrefix) {
      builder.withExternalId(options.externalIdPrefix);
    }

    if (options.dateFields) {
      builder.withDateTransformation(options.dateFields);
    }

    return await builder.build();
  }

  /**
   * Generic update method
   * @param {string} id - Record ID
   * @param {Object} data - Data to update
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async update(id, data, options = {}) {
    const updateData = { ...data };

    // Transform date fields if specified
    if (options.dateFields) {
      options.dateFields.forEach((field) => {
        if (updateData[field]) {
          updateData[field] = new Date(updateData[field]);
        }
      });
    }

    // Validate if schema provided
    if (options.validation) {
      options.validation.parse(updateData);
    }

    const query = {
      where: { id },
      data: updateData,
    };

    if (options.includes) {
      query.include = options.includes;
    }

    return await this.prismaModel.update(query);
  }

  /**
   * Generic find by ID method
   * @param {string} id - Record ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object|null>}
   */
  async findById(id, options = {}) {
    const fetcher = this.createFetcher().excludeDeleted();

    if (options.includes) {
      fetcher.include(options.includes);
    }

    if (options.select) {
      fetcher.select(options.select);
    }

    return await fetcher.findById(id);
  }

  /**
   * Generic find by external ID method
   * @param {string} externalId - External ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object|null>}
   */
  async findByExternalId(externalId, options = {}) {
    const fetcher = this.createFetcher().excludeDeleted();

    if (options.includes) {
      fetcher.include(options.includes);
    }

    if (options.select) {
      fetcher.select(options.select);
    }

    return await fetcher.findByExternalId(externalId);
  }

  /**
   * Generic find many method with pagination and filtering
   * @param {Object} filters - Filter conditions
   * @param {Object} options - Additional options
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async findMany(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      searchFields = [],
      ...otherFilters
    } = filters;

    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where(otherFilters)
      .paginate(page, limit);

    if (search && searchFields.length > 0) {
      fetcher.search(search, searchFields);
    }

    if (options.includes) {
      fetcher.include(options.includes);
    }

    if (options.select) {
      fetcher.select(options.select);
    }

    if (options.orderBy) {
      fetcher.orderBy(options.orderBy);
    }

    const result = await fetcher.findMany();

    return {
      [this.getCollectionName()]: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Generic soft delete method
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async softDelete(id) {
    await this.prismaModel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Generic restore method
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async restore(id) {
    await this.prismaModel.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Generic hard delete method
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async hardDelete(id) {
    await this.prismaModel.delete({
      where: { id },
    });
  }

  /**
   * Get collection name for responses (plural form)
   * Can be overridden by subclasses
   * @returns {string}
   */
  getCollectionName() {
    return `${this.modelName.toLowerCase()}s`;
  }

  /**
   * Get default includes for the model
   * Can be overridden by subclasses
   * @returns {Object}
   */
  getDefaultIncludes() {
    return {};
  }

  /**
   * Get default search fields for the model
   * Can be overridden by subclasses
   * @returns {Array<string>}
   */
  getDefaultSearchFields() {
    return [];
  }

  /**
   * Get default order by for the model
   * Can be overridden by subclasses
   * @returns {Object}
   */
  getDefaultOrderBy() {
    return { createdAt: "desc" };
  }
}

module.exports = BaseService;
