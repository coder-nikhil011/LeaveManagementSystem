// utils/dateUtils.js
// Purpose: Centralized date utility functions
// Used by: ruleEngine, workloadService, controllers

/**
 * Normalize date string to midnight to avoid timezone issues
 * @param {string} dateString - Format YYYY-MM-DD
 * @returns {Date}
 */
exports.normalizeDate = (dateString) => {
  return new Date(dateString + "T00:00:00");
};


/**
 * Validate date order
 * @param {string} startDate
 * @param {string} endDate
 * @returns {boolean}
 */
exports.isInvalidRange = (startDate, endDate) => {
  const start = exports.normalizeDate(startDate);
  const end = exports.normalizeDate(endDate);
  return end < start;
};


/**
 * Calculate inclusive number of days between two dates
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number}
 */
exports.calculateLeaveDays = (startDate, endDate) => {
  const start = exports.normalizeDate(startDate);
  const end = exports.normalizeDate(endDate);

  const diff = (end - start) / (1000 * 60 * 60 * 24);

  return diff + 1;
};


/**
 * Check if date is in the past
 * @param {string} dateString
 * @returns {boolean}
 */
exports.isPastDate = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = exports.normalizeDate(dateString);

  return date < today;
};