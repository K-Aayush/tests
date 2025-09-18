const { generatePrefixedExternalId } = require("../utils/externalId");

/**
 * Base Builder class for creating domain objects
 * Implements the Builder pattern for consistent object creation
 */
class BaseBuilder {
  constructor(modelName, prismaModel) {
    this.modelName = modelName;
    this.prismaModel = prismaModel;
    this.data = {};
    this.includes = {};
    this.validationSchema = null;
  }

  /**
   * Set validation schema for the builder
   * @param {Object} schema - Zod validation schema
   * @returns {BaseBuilder}
   */
  withValidation(schema) {
    this.validationSchema = schema;
    return this;
  }

  /**
   * Set data for the builder
   * @param {Object} data - Data to build the object with
   * @returns {BaseBuilder}
   */
  withData(data) {
    this.data = { ...this.data, ...data };
    return this;
  }

  /**
   * Set includes for the builder (for Prisma relations)
   * @param {Object} includes - Relations to include
   * @returns {BaseBuilder}
   */
  withIncludes(includes) {
    this.includes = { ...this.includes, ...includes };
    return this;
  }

  /**
   * Generate external ID if not provided
   * @param {string} prefix - Prefix for external ID
   * @returns {BaseBuilder}
   */
  withExternalId(prefix) {
    if (!this.data.externalId) {
      this.data.externalId = generatePrefixedExternalId(prefix);
    }
    return this;
  }

  /**
   * Transform date fields from strings to Date objects
   * @param {Array<string>} dateFields - Array of field names that should be converted to dates
   * @returns {BaseBuilder}
   */
  withDateTransformation(dateFields = []) {
    dateFields.forEach((field) => {
      if (this.data[field]) {
        this.data[field] = new Date(this.data[field]);
      }
    });
    return this;
  }

  /**
   * Validate data using the provided schema
   * @throws {Error} If validation fails
   */
  validate() {
    if (this.validationSchema) {
      this.validationSchema.parse(this.data);
    }
  }

  /**
   * Build the object using Prisma
   * @returns {Promise<Object>} Created object
   */
  async build() {
    this.validate();

    const createData = this.prepareCreateData();

    return await this.prismaModel.create({
      data: createData,
      include: this.includes,
    });
  }

  /**
   * Prepare data for creation - can be overridden by subclasses
   * @returns {Object} Prepared data
   */
  prepareCreateData() {
    return this.data;
  }

  /**
   * Reset the builder to initial state
   * @returns {BaseBuilder}
   */
  reset() {
    this.data = {};
    this.includes = {};
    return this;
  }
}

module.exports = BaseBuilder;
