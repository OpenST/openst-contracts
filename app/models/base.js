"use strict";

const ModelBaseKlass = function () {};

ModelBaseKlass.prototype = {

  convertEnumForDB: function (params, readable) {
    var oThis = this
      , enumKeys = Object.keys(oThis.enums);

    for (var i = 0; i < enumKeys.length; i++) {
      var enum_k = enumKeys[i];

      if (params[enum_k]) {
        params[enum_k] = readable ? oThis.enums[enum_k]['val'][params[enum_k]] : oThis.enums[enum_k]['inverted'][params[enum_k]];
      }
    }
    return params;
  },

  convertEnumForResult: function (params) {
    return this.convertEnumForDB(params, true);
  },

  create: function (params) {

    var oThis = this
      , createFields = []
      , setFieldsValues = []
    ;

    params = oThis.convertEnumForDB(params);

    for (var key in params) {
      if(key=='id' || key=='updated_at' || key=='created_at') continue;
      createFields.push(key);
      setFieldsValues.push(params[key])
    }

    return oThis.QueryDB.insert(
      oThis.tableName,
      createFields,
      setFieldsValues
    );

  },

  edit: function (params) {
    var oThis = this
      , editFields = []
      , setFieldsValues = []
      , whereCondFields = []
      , whereCondFieldsValues = []
    ;

    params['qParams'] = oThis.convertEnumForDB(params['qParams']);
    for (var key in params['qParams']) {
      if(key=='id' || key=='updated_at' || key=='created_at') continue;
      editFields.push(key + '=?');
      setFieldsValues.push(params['qParams'][key])
    }

    for (var key in params['whereCondition']) {
      whereCondFields.push(key + '=?');
      whereCondFieldsValues.push(params['whereCondition'][key]);
    }

    return oThis.QueryDB.edit(
      oThis.tableName,
      editFields,
      setFieldsValues,
      whereCondFields,
      whereCondFieldsValues
    );
  }

};

module.exports = ModelBaseKlass;