/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
const Uint64 = require('cuint').UINT64;
const Int64 = require('int64-napi').Int64;
const { convertPathToChunkBoundaryFormat } = require('../change_set_processing/chunk_change_set');

/**
 * Handles comparison for HFDM Types
 */
class Comparator {
  /**
   * Compares two things for sorting
   * @param {*} aValue - First comparable
   * @param {*} bValue - Second comparable
   * @return {Number} - Comparison result for sorting
   */
  compare(aValue, bValue) {
    if (aValue !== undefined && bValue !== undefined) {
      return this._compare(aValue, bValue);
    } else {
      if (aValue === undefined && bValue === undefined) {
        return 0;
      } else {
        if (aValue === undefined && bValue !== undefined) {
          return -1;
        } else {
          return 1;
        }
      }
    }
  }
}

/**
 * Provides comparison for the Int64 type
 */
class Int64Comparator extends Comparator {
  /**
   * Compares two Int64 for sorting
   * @param {Int64} aValue - First comparable
   * @param {Int64} bValue - Second comparable
   * @return {Number} - Comparison result for sorting
   */
  _compare(aValue, bValue) {
    const aInt = new Int64(aValue[0], aValue[1]);
    const bInt = new Int64(bValue[0], bValue[1]);

    if (aInt.eq(bInt)) {
      return 0;
    } else {
      if (aInt.gt(bInt)) {
        return 1;
      } else {
        return -1;
      }
    }
  }
}

/**
 * Provides comparison for the Uint64 type
 */
class UInt64Comparator extends Comparator {
   /**
   * Compares two Uint64 for sorting
   * @param {Uint64} aValue - First comparable
   * @param {Uint64} bValue - Second comparable
   * @return {Number} - Comparison result for sorting
   */
  _compare(aValue, bValue) {
    const aUInt = new Uint64(aValue[0], aValue[1]);
    const bUInt = new Uint64(bValue[0], bValue[1]);

    if (aUInt.equals(bUInt)) {
      return 0;
    } else {
      if (aUInt.greaterThan(bUInt)) {
        return 1;
      } else {
        return -1;
      }
    }
  }
}

/**
 * Provides comparison for anything comparable natively in JavaScript
 */
class JSComparableComparator extends Comparator {
  /**
   * Compares two String for sorting
   * @param {String} aValue - First comparable
   * @param {String} bValue - Second comparable
   * @return {Number} - Comparison result for sorting
   */
  _compare(aValue, bValue) {
    if (aValue === bValue) {
      return 0;
    } else {
      if (aValue > bValue) {
        return 1;
      } else {
        return -1;
      }
    }
  }
}

/**
 * Provides comparison for map keys
 */
class KeyComparator extends JSComparableComparator {
  /**
   * Compares two String for sorting
   * @param {String} aPath - First comparable
   * @param {String} bPath - Second comparable
   * @return {Number} - Comparison result for sorting
   */
  _compare(aPath, bPath) {
    const comparableKeyA = convertPathToChunkBoundaryFormat(aPath);
    const comparableKeyB = convertPathToChunkBoundaryFormat(bPath);

    return JSComparableComparator.prototype._compare.call(this, comparableKeyA, comparableKeyB);
  }
}

/**
 * A factory for comparators
 */
class ComparatorFactory {
  /**
   * Returns a comparator for types
   * @param {String} type - Type used for comparison
   * @return {Comparator} - Comparator
   */
  static getComparator(type) {
    switch (type) {
      case 'Uint64':
        return new UInt64Comparator();
      case 'Int64':
        return new Int64Comparator();
      default:
        return new JSComparableComparator();
    }
  }

  /**
   * Returns a comparator for types
   * @return {Comparator} - Comparator
   */
  static getKeyComparator() {
    return new KeyComparator();
  }
}

module.exports = ComparatorFactory;
