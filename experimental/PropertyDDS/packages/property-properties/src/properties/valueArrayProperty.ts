/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint-disable new-cap*/
/**
 * @fileoverview Definition of the valuearray property class
 */

import _ from 'lodash';
import { constants } from '@fluid-experimental/property-common';
import { _castFunctors } from './primitiveTypeCasts';
import {
    BaseDataArray,
    UniversalDataArray,
    BoolDataArray,
    Uint64,
    Int64
} from '@fluid-experimental/property-common';
import { ArrayProperty, IArrayPropertyParams } from './arrayProperty';
import { Int64Property, Uint64Property } from '../properties/intProperties';
import { PathHelper, SerializedChangeSet } from '@fluid-experimental/property-changeset';
import { BaseProperty } from '.';
const { MSG } = constants;
/**
 * An array property which stores primitive values
 */
export class ValueArrayProperty extends ArrayProperty {
    _isPrimitive = true;

    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super(in_params, 'true');
    };


    /**
     * returns the value at in_position for a primitive array
     * @param in_position - the array index
     * @return {*} the value
     */
    _getValue(in_position: number) {
        return this._dataArrayRef.getValue(in_position);
    };

    /**
     * returns the array of primitive values.
     * @return {Array<*>} the array of values.
     * For example: ['string1', 'string2']
     */
    getValues() {
        var result = [];
        var ids = this.getIds();
        for (var i = 0; i < ids.length; i++) {
            result.push(this.get(ids[i]));
        }
        return result;
    };

    /**
     * Resolves a direct child node based on the given path segment
     *
     * @param in_segment - The path segment to resolve
     * @param in_segmentType - The type of segment in the tokenized path
     *
     * @returns The child property that has been resolved
     */
    _resolvePathSegment(in_segment: string, in_segmentType: PathHelper.TOKEN_TYPES): BaseProperty | undefined {
        return this.get(in_segment);
    };

    /**
     * Function to serialize special primitive types.
     * Some primitive types (e.g. Int64, which is not natively supported by javascript) require
     * special treatment on serialization. For supported types, we can just return the input here.
     *
     * @param in_obj - The object to be serialized
     * @returns the serialized object
     */
    _serializeValue(in_obj: object): SerializedChangeSet {
        return in_obj;
    };

    /**
     * Function to serialize arrays of special primitive types.
     * Some primitive types (e.g. Int64, which is not natively supported by javascript) require
     * special treatment on serialization. For supported types, we can just return the input here.
     *
     * @param in_array - The array of special objects to be serialized
     * @returns the serialized object
     */
    _serializeArray(in_array: object[]): SerializedChangeSet[] {
        return in_array;
    };

    /**
     * Function to deserialize arrays of special primitive types.
     * Some primitive types (e.g. Int64, which is not natively supported by javascript) require
     * special treatment on deserialization. For supported types, we can just return the input here.
     *
     * @param in_serializedObj the serialized object
     * @returns The array of special objects that were deserialized
     */
    _deserializeArray(in_serializedObj: SerializedChangeSet): object[] {
        return in_serializedObj;
    };
}

/**
 * An ArrayProperty which stores Float32 values
 */
export class Float32ArrayProperty extends ValueArrayProperty {

    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Float32' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Float32Array, in_length);
    };
}

/**
 * An ArrayProperty which stores Float64 values
 */
export class Float64ArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Float64' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Float64Array, in_length);
    };
}

/**
 * An ArrayProperty which stores Uint8 values
 */
export class Uint8ArrayProperty extends ValueArrayProperty {
    /**
     * @param {Object} in_params - Input parameters for property creation
     *
     * @constructor
     * @protected
     * @extends property-properties.ValueArrayProperty
     * @alias property-properties.Uint8ArrayProperty
     * @category Arrays
     */
    constructor(in_params) {
        super({ ...in_params, typeid: 'Uint8' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Uint8Array, in_length);
    };
}

/**
 * An ArrayProperty which stores Int8 values
 *
*/
export class Int8ArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Int8' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Int8Array, in_length);
    };

}

/**
 * An ArrayProperty which stores Uint16 values
 */
export class Uint16ArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Uint16' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Uint16Array, in_length);
    };
}


/**
 * An ArrayProperty which stores Int16 values
 */
export class Int16ArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Int16' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Int16Array, in_length);
    };

}

/**
 * An ArrayProperty which stores Uint32 values
 */
export class Uint32ArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Uint32' });
    };


    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Uint32Array, in_length);
    };
}


/**
 * An ArrayProperty which stores Int32 values
 */
export class Int32ArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Int32' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BaseDataArray(Int32Array, in_length);
    };
}

/**
 * An ArrayProperty which stores Int64 values
 */
export class Integer64ArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super(in_params);
    };

    /**
     * Function to serialize special primitive types.
     * Some primitive types (e.g. Int64, which is not natively supported by javascript) require
     * special treatment on serialization. For supported types, we can just return the input here.
     *
     * @param in_obj - The object to be serialized
     * @returns the serialized object
     */
    _serializeValue(in_obj): SerializedChangeSet {
        if (in_obj instanceof Int64 || in_obj instanceof Uint64) {
            return [in_obj.getValueLow(), in_obj.getValueHigh()];
        }
        return in_obj;
    };


    /**
     * Function to serialize arrays of special primitive types.
     * Some primitive types (e.g. Int64, which is not natively supported by javascript) require
     * special treatment on serialization. For supported types, we can just return the input here.
     *
     * @param in_array - The array of special objects to be serialized
     * @returns the serialized object
     */
    _serializeArray(in_array: Array<any>): SerializedChangeSet {
        var result = [];
        for (var i = 0; i < in_array.length; i++) {
            result.push(this._serializeValue(in_array[i]));
        }
        return result;
    };

    /**
     * Function to deserialize arrays of special primitive types.
     * Some primitive types (e.g. Int64, which is not natively supported by javascript) require
     * special treatment on deserialization. For supported types, we can just return the input here.
     *
     * @param in_serializedObj the serialized object
     * @returns in_array - The array of special objects that were deserialized
     */
    _deserializeArray(in_serializedObj: SerializedChangeSet): Array<SerializedChangeSet> {
        var result = [];
        for (var i = 0; i < in_serializedObj.length; i++) {
            result.push(this._deserializeValue(in_serializedObj[i]));
        }
        return result;
    };

    /**
     * @inheritdoc
     */
    _prettyPrint(indent, externalId, printFct) {

        printFct(indent + externalId + this.getId() + ' (Array of ' + this.getTypeid() + '): [');
        var childIndent = indent + '  ';
        var int64Prop;
        for (var i = 0; i < this._dataArrayGetLength(); i++) {
            // TODO: The 'toString()' function is defined on Integer64Property, so we need to create
            //       such object to use it. It would be better to have it in Integer64.prototype.toString
            if (this._dataArrayGetValue(i) instanceof Int64) {
                int64Prop = new Int64Property({});
            } else {
                int64Prop = new Uint64Property({});
            }
            int64Prop.setValueLow(this._dataArrayGetValue(i).getValueLow());
            int64Prop.setValueHigh(this._dataArrayGetValue(i).getValueHigh());
            printFct(childIndent + i + ': ' + int64Prop);
        }
        printFct(indent + ']');
    };
}
/**
 * An ArrayProperty which stores Int64 values
 */
export class Int64ArrayProperty extends Integer64ArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Int64' });
    };

    /**
     * Sets the array properties elements to the content of the given array
     * All changed elements must already exist. This will overwrite existing elements.
     * @param in_offset - target start index
     * @param in_array - contains the elements to be set
     * @throws if in_offset is not a number
     * @throws if in_offset is smaller than zero or higher than the length of the array
     */
    setRange(in_offset: number, in_array: Array<string | number | Int64>) {
        if (!_.isArray(in_array)) {
            throw new Error(MSG.IN_ARRAY_NOT_ARRAY + 'Int64ArrayProperty.setRange');
        }
        var out_array = in_array.map((element) => {
            return _castFunctors.Int64(element);
        });
        ArrayProperty.prototype.setRange.call(this, in_offset, out_array);
    };

    /**
     * Inserts the content of a given array into the array property
     * It will not overwrite the existing values but push them to the right instead.
     * E.g. [1, 2, 3] .insertRange(1, [9, 8]) => [1, 9, 8, 2, 3]
     * @param in_offset - target index
     * @param in_array - the array to be inserted
     * @throws if in_offset is smaller than zero, larger than the length of the array or not a number.
     * @throws if trying to insert a property that already has a parent.
     * @throws if trying to modify a referenced property.
     */
    insertRange(in_offset: number, in_array: Array<string | number | Int64>) {
        var out_array = in_array.map((element) => {
            return _castFunctors.Int64(element);
        });
        ArrayProperty.prototype.insertRange.call(this, in_offset, out_array);
    };

    /**
     * Specialized function to deserialize Int64 primitive types.
     * Some primitive types (e.g. Int64, which is not natively supported by javascript) require
     * special treatment on deserialization. For supported types, we can just return the input here.
     *
     * @param in_serializedObj - The object to be deserialized
     * @returns the deserialized value
     */
    _deserializeValue(in_serializedObj: SerializedChangeSet): Int64 {
        return new Int64(in_serializedObj[0], in_serializedObj[1]);
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new UniversalDataArray(in_length);
        for (var i = 0; i < in_length; i++) {
            this._dataArraySetValue(i, new Int64());
        }
    };

}

/**
 * An ArrayProperty which stores Uint64 values
 */
export class Uint64ArrayProperty extends Integer64ArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Uint64' });
    };

    /**
     * Specialized function to deserialize Uint64 primitive types.
     * Some primitive types (e.g. Uint64, which is not natively supported by javascript) require
     * special treatment on deserialization. For supported types, we can just return the input here.
     *
     * @param in_serializedObj - The object to be deserialized
     * @returns the deserialized value
     */
    _deserializeValue(in_serializedObj: SerializedChangeSet): Uint64 {
        return new Uint64(in_serializedObj[0], in_serializedObj[1]);
    };

    /**
     * Sets the array properties elements to the content of the given array
     * All changed elements must already exist. This will overwrite existing elements.
     * @param in_offset - target start index
     * @param  in_array contains the elements to be set
     * @throws if in_offset is not a number
     * @throws if in_offset is smaller than zero or higher than the length of the array
     */
    setRange(in_offset: number, in_array: Array<string | number | Uint64>) {
        if (!_.isArray(in_array)) {
            throw new Error(MSG.IN_ARRAY_NOT_ARRAY + 'Uint64ArrayProperty.setRange');
        }
        var out_array = in_array.map((element) => {
            return _castFunctors.Uint64(element);
        });
        ArrayProperty.prototype.setRange.call(this, in_offset, out_array);
    };

    /**
     * Inserts the content of a given array into the array property
     * It will not overwrite the existing values but push them to the right instead.
     * E.g. [1, 2, 3] .insertRange(1, [9, 8]) => [1, 9, 8, 2, 3]
     * @param in_offset - target index
     * @param in_array - the array to be inserted
     * @throws if in_offset is smaller than zero, larger than the length of the array or not a number.
     * @throws if trying to insert a property that already has a parent.
     * @throws if trying to modify a referenced property.
     */
    insertRange(in_offset: number, in_array: Array<string | number | Uint64>) {
        var out_array = in_array.map((element) => {
            return _castFunctors.Uint64(element);
        });
        ArrayProperty.prototype.insertRange.call(this, in_offset, out_array);
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new UniversalDataArray(in_length);
        for (var i = 0; i < in_length; i++) {
            this._dataArraySetValue(i, new Uint64());
        }
    };

}

/**
 * An ArrayProperty which stores String values
 */
export class StringArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'String' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length      the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new UniversalDataArray(in_length);
        for (var i = 0; i < in_length; i++) {
            this._dataArraySetValue(i, '');
        }
    };

}

/**
 * An ArrayProperty which stores Boolean values
 */
export class BoolArrayProperty extends ValueArrayProperty {
    /**
     * @param in_params - Input parameters for property creation
     */
    constructor(in_params: IArrayPropertyParams) {
        super({ ...in_params, typeid: 'Bool' });
    };

    /**
     * Creates and initializes the data array
     * @param in_length - the initial length of the array
     */
    _dataArrayCreate(in_length: number) {
        this._dataArrayRef = new BoolDataArray(in_length);
        for (var i = 0; i < in_length; i++) {
            this._dataArraySetValue(i, false);
        }
    };
}
