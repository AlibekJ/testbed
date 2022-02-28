//Generic account class. 
//Extend as needed and create classes for other account types

let TheM;
 


export class Demodata {
  #AWSMDataId;
  #AWSMUserId;
  #name;
  #typeId;
  #typeName;
  #dtsOpened = 0;
  #dtsUpdated = 0;
  #isHidden = false;
  #isActive = true;

  constructor(given, givenTheM) {
    given = given || {};
    let _el = this;
    TheM = givenTheM;
    _el.#AWSMDataId = given.AWSMDataId;


     this.#doDigest(given);
  };

  #modified = (function (given = {}) {
    const _modified = {};
    const _el = given;
    let _timeoutModifiedFlag;
    let _dtsModified = (_el || {}).dtsModified || new Date("1978-10-15");

    for (let prop in given)
      if (Object.getOwnPropertyDescriptor(given, prop))
        if (Object.getOwnPropertyDescriptor(_modified, prop).set)
          if (prop !== "dtsModified")
            _modified[prop] = given[prop];


    const _toJSON = function () {
      let resp = {
        ..._modified
      };
      resp.dtsModified = new Date(_dtsModified);

      //check is there anything meaningful
      let i = 0;
      for (let prop in resp)
        if (prop !== "dtsModified") i++;
      if (i === 0) return undefined;

      return resp;
    };

   

    Object.defineProperty(_modified, "dtsModified", {
      enumerable: false,
      configurable: false,
      get: function () {
        return _dtsModified;
      },
      set: function (givenDts) {
        _dtsModified = givenDts || _dtsModified;
      }
    });


    let handler = {
      get: function (target, nameRequested) {
        if (nameRequested === "toJSON") return _toJSON();
        return _modified[nameRequested];
      },
      set: function (givenElement, index, value) {
        _dtsModified = new Date();
        if (!_timeoutModifiedFlag) setTimeout(_doSend, 500); //accumulate all changes for half a second and send them at once
        return ((_modified[index] = value) || true);
      }
    };
    return new Proxy(_modified, handler);
  })(this);

  get AWSMDataId() {
    return this.#AWSMDataId;
  };

  get id() {
    return this.#AWSMDataId;
  };

  get AWSMUserId() {
    return this.#AWSMUserId;
  };

  get name() {
    return this.#name || this.#typeName;
  };

  set name(given) {
    if (given === undefined) return this.#name || true;
    given = given.substring(0, 128).trim();
    if (given === this.#name) return this.#name || true;
    this.#modified.name = given;
    return ((this.#name = given) || true);
  };

  get typeId() {
    return this.#typeId;
  };

  get typeName() {
    return this.#typeName;
  };

  get dtsOpened() {
    return this.#dtsOpened;
  };

  get dtsUpdated() {
    return this.#dtsUpdated;
  };

  get isHidden() { // has user requested not to display this account prominently
    return this.#isHidden;
  };

  set isHidden(given) {
    if (given !== true && given !== false) return this.#isHidden;
    if (this.#isHidden === given) return given;
    this.#modified.isHidden = given;
    return this.#isHidden = given;
  };

  get isActive() { // if the account is active and ready for transactions
    return this.#isActive;
  };


  get toJSON() {
    return {
      AWSMDataId: this.#AWSMDataId,
      AWSMUserId: this.#AWSMUserId,
      name: this.#name,
      typeId: this.#typeId,
      typeName: this.#typeName,
      dtsOpened: this.#dtsOpened,
      dtsUpdated: this.#dtsUpdated,
      isHidden: this.#isHidden,
      isActive: this.#isActive
    };
  };

  #doDigest = function (given) {
    if (!given.dtsUpdated) return;
    if (!given.AWSMDataId) return;
    if (this.#AWSMDataId && this.#AWSMDataId !== given.AWSMDataId) return;

    this.#AWSMDataId = given.AWSMDataId || this.#AWSMDataId;
    this.#AWSMUserId = given.AWSMUserId || this.#AWSMUserId;
    this.#name = given.name || this.#name;
    this.#typeId = given.typeId || this.#typeId;
    this.#typeName = given.typeName || this.#typeName;
    this.#dtsOpened = (given.dtsOpened ? new Date(given.dtsOpened) : this.#dtsOpened);
    this.#dtsUpdated = (given.dtsUpdated ? new Date(given.dtsUpdated) : (this.#dtsUpdated || new Date()));
    this.#isHidden = (given.hasOwnProperty("isHidden") ? given.isHidden : this.#isHidden);
    this.#isActive = (given.hasOwnProperty("isActive") ? given.isActive : this.#isActive);

    //take all other properties as-is
    for (let prop in given)
      if (prop !== "success")
        if (!(prop in this) || (Object.getOwnPropertyDescriptor(this, prop) || {}).configurable)
          this[prop] = given[prop];
  }

  doDigest(given = {}) {
    return this.#doDigest(given)
  };

  static isTypeIdOK(givenTypeId) {
    return true;
  };
};
 

const DATA_TYPE_ID_TO_CLASS = {};
DATA_TYPE_ID_TO_CLASS["default"] = Demodata;
DATA_TYPE_ID_TO_CLASS["demodata"] = Demodata;

export { DATA_TYPE_ID_TO_CLASS as DATA_TYPE_ID_TO_CLASS };