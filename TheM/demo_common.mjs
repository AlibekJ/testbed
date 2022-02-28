




export async function doInit(TheM) {


  if (!TheM.isBrowser) {
    var axios = (await import("axios")).default;
  };




  let _common = {};
  let localStorageWorker;
  let isiOS = false; //iOS does not support webworkers, so data is stored in localStorage
  if (typeof thisDevice !== "undefined" && thisDevice.platform && thisDevice.platform.includes("ios")) isiOS = true;
  let _dtslastCall; //date-time when the last call to server was made
  const _loadingwhat = [];
  let _loading = 0;
  let storables = {};
  let retrievables = {};
  let _token;
  let _isAsyncOk = false;




  /**
   * Returns a random string of the given length
   *
   * @param {number}  givenLength  
   * @param {boolean} isDateAsPrefix false by default. If true, the string will be prefixed with a string representing the current time  
   * @returns {string} 
   */
  Object.defineProperty(_common, "GetRandomSTR", {
    configurable: false,
    enumerable: false,
    value: function (givenLength, isDateAsPrefix) {
      let str = "";
      if (isDateAsPrefix) str = (new Date()).valueOf().toString(36);
      while (str.length < givenLength) {
        str += Math.random().toString(36).substring(2, givenLength);
      }
      return str.substring(0, givenLength);
    }
  });

  /**
   * Given string or a number, will return a string which looks like an amount. 
   * "123.123" becomes "123.12"; 123.123 becomes 123.12
   *
   * @param {number}  givenDirty  
   * @returns {string} 
   */
  Object.defineProperty(_common, "cleanUpAmount", { //returns a string
    configurable: false,
    enumerable: false,
    value: function (givenDirty) {
      givenDirty = givenDirty || 0;
      givenDirty = (givenDirty + "").replace(/^0+/, "").replace(/[^\d.-]/g, "");
      if (Math.round(givenDirty) !== +(givenDirty)) {
        givenDirty = (+(givenDirty)).toFixed(2);
      }
      if (isNaN(givenDirty)) {
        givenDirty = "0";
      };
      return givenDirty;
    }
  });



  /**
   * Given string or a number, will return a number which looks like an amount. 
   * "123.123" becomes 123.12; 123.123 becomes 123.12
   *
   * @param {number}  givenDirty  
   * @returns {string} 
   */
  Object.defineProperty(_common, "toAmount", { //returns a number
    configurable: false,
    enumerable: false,
    value: function (givenDirty) {
      givenDirty = givenDirty || 0;
      givenDirty = (givenDirty + "").replace(/^0+/, "").replace(/[^\d.-]/g, "");
      if (Math.round(givenDirty) !== +(givenDirty)) {
        givenDirty = (+(givenDirty)).toFixed(2);
      }
      givenDirty = parseFloat(givenDirty);
      if (isNaN(givenDirty)) {
        givenDirty = 0;
      };
      return parseFloat(givenDirty.toFixed(2));
    }
  });



  /**
   * Given string or a number, will return a string which looks like an amount. 
   * "123.123" and "USD" becomes "$123.12"; 123.123 and "EUR" becomes "€123.12"; 123.123 and "AED" becomes "123.12 AED" 
   *
   * @param {number}  givenDirty  
   * @returns {string} 
   */
  Object.defineProperty(_common, "toShortAmount", { //returns a string number with a currency symbol
    configurable: false,
    enumerable: false,
    value: function (givenDirty, givenCurrency) {
      givenDirty = givenDirty || 0;
      givenDirty = (givenDirty + "").replace(/^0+/, "").replace(/[^\d.-]/g, "");

      givenCurrency = givenCurrency.trim().substring(0, 3).toUpperCase();

      if (Math.round(givenDirty) !== +(givenDirty)) {
        givenDirty = (+(givenDirty)).toFixed(2);
      }
      givenDirty = parseFloat(givenDirty);
      if (isNaN(givenDirty)) {
        givenDirty = 0;
      };

      let amount = parseFloat(givenDirty.toFixed(2));

      let resp = "";

      if (givenCurrency === "USD") { resp = "$" + amount; }
      else if (givenCurrency === "EUR") { resp = "€" + amount; }
      else if (givenCurrency === "KZT") { resp = "₸" + amount; }
      else if (givenCurrency === "JPY") { resp = "¥" + amount; }
      else if (givenCurrency === "GBP") { resp = "£" + amount; }
      else {
        resp = "" + amount + " " + givenCurrency;
      };

      return;
    }
  });



  /**
   * Given a string, will return a string in which first words are capitalized
   * JOHN DOE to John Doe; JEAN-JACK RUSSAU to Jean-Jack Russau
   *
   * @param {number}  givenDirty  
   * @returns {string} 
   */
  Object.defineProperty(_common, "toNameFormat", {
    configurable: false,
    enumerable: false,
    value: function (given) {
      given = given || "";
      let resp = "";
      for (let i = given.length; i--;)
        if (i === 0 || (i > 0 && (given[i - 1] === " " || given[i - 1] === "-"))) {
          resp = given[i].toUpperCase() + resp;
        } else {
          resp = given[i] + resp
        }
      return resp;

    }
  });

  Object.defineProperty(_common, "isDate", { //returns true if givenDts is a date
    configurable: false,
    enumerable: false,
    value: function (givenDts) {
      if (!givenDts) return false;
      return (givenDts instanceof Date && !isNaN(givenDts.valueOf()));
    }
  });

  /**
   * Merges two arrays. Checks duplicates by checking propertyName fields.
   *
   * @param {number}  givenDirty  
   * @returns {string} 
   */
  Object.defineProperty(_common, "DeDupAndAdd", {
    configurable: false,
    enumerable: false,
    value: function (givenOld, givenNew, propertyName) {
      if ((!givenOld) || (!givenNew)) return false;

      propertyName = propertyName || "id";


      const _deepCopy = function (given) {
        if (typeof given !== "object") return given;
        return { ...given };
      };


      for (let EE = 0; EE < givenNew.length; EE++) {
        let Found = false;
        if (givenNew[EE] && givenNew[EE][propertyName]) {
          for (let RR = 0; RR < givenOld.length; RR++) {
            if (givenOld[RR]) {
              if (givenOld[RR][propertyName] && givenNew[EE][propertyName] && givenOld[RR][propertyName] === givenNew[EE][propertyName]) {
                givenOld[RR] = _deepCopy(givenNew[EE]); //replace object if ID found
                Found = true;
              }
            }
          }
          if (!Found) {
            givenOld.push(givenNew[EE]); //add the record as it is new
          }
        }
      }
      return true;
    }
  });






  Object.defineProperty(_common, "removeInternal", {
    configurable: false,
    enumerable: false,
    value: function (given) {
      function hop(what) {
        for (let el in what)
          if (el.startsWith("$") || el.startsWith("_")) {
            delete what[el];
          } else if (Array.isArray(what[el])) {
            hop(what[el]);
          } else if (typeof what[el] === "object") hop(what[el]);
      }
      hop(given);
    }
  });

  Object.defineProperty(_common, "takeNewToken", {
    configurable: false,
    enumerable: false,
    value: function (givenToken) {
      return _token = givenToken;
    }
  });


  //an interface for an external webworker to save and retrieve data from the localStorage. 
  //Does not work in Safari 
  if (TheM.isBrowser && !localStorageWorker && !isiOS) {
    localStorageWorker = new Worker(TheM.config.modulesFolder + "demo_webworker.js");
    localStorageWorker.postMessage({ isInit: true, baseLibURL: TheM.config.baseLibURL });
    localStorageWorker.onmessage = function (event) {

      if (event.data) {
        if (event.data.type === "store" && event.data.storableId) {
          if (storables[event.data.storableId]) {
            console.log("stored " + event.data.tag);
            storables[event.data.storableId]();
          }

        } else if (event.data.type === "retrieve") {
          if (retrievables[event.data.retrievableId]) {
            console.log("restored " + event.data.tag);
            if (retrievables[event.data.retrievableId].objectToPopulate) {
              for (const prop of Object.getOwnPropertyNames(retrievables[event.data.retrievableId].objectToPopulate)) {
                delete retrievables[event.data.retrievableId].objectToPopulate[prop];
              }
              Object.assign(retrievables[event.data.retrievableId].objectToPopulate, event.data.payload);
            };
            retrievables[event.data.retrievableId].resolve(event.data.payload);
          }
        }
      }
    }
  };



  Object.defineProperty(_common, "storeLocally", {
    configurable: false,
    enumerable: false,
    value: function (tag, payload, isForced) {
      //{tag:"whatever", payload: object, isForced:false}  isForced is needed for iOS only, see below
      //Stores them in a indexedDB (or localStorage in case of iOS) if it is a browser.
      //If not a browser, does nothing
      return new Promise(function (resolve, reject) {
        if (!TheM.isBrowser) return resolve(); //if not a browser, just resolve and do nothing
        if (!TheM.isLocalSavingAllowed) return resolve();


        let _tag = tag;
        let _payload = payload;
        let _isForced = (isForced === true ? true : false);
        if (tag.tag) _tag = tag.tag;
        if (tag.payload) _payload = tag.payload;
        if (tag.isForced) (tag.isForced === true ? true : false);



        if (!isiOS) { //a normal device
          let randomId = TheM.common.GetRandomSTR(40);
          storables[randomId] = resolve;
          let storable = {
            type: "store",
            tag: TheM.config.LOCAL_STORAGE_TAG_PREFIX + _tag,
            storableId: randomId,
            payload: _payload
          };
          localStorageWorker.postMessage(JSON.parse(JSON.stringify(storable)));

        } else { //iOS, so employ a workaround

          //If forced, will save immediately. If not (default) will save after a second of the last call.
          //If another call is made while this second is elapsing, it adds another second to the delay.
          //In other words, saves only a second after the last call to save.

          if (storables[_tag] && storables[_tag].timeout) {
            //such tag is already pending for saving
            clearTimeout(storables[_tag].timeout);
          } else {
            //no object pending to be saved 
            storables[_tag] = {};
          }

          storables[_tag].payload = JSON.stringify(_payload);
          storables[_tag].resolve = resolve;
          storables[_tag].timeout = setTimeout(function () {
            window.localStorage.setItem(_tag, (storables[_tag].payload ? LZString.compressToUTF16(storables[_tag].payload) : undefined));
            console.log("stored in the localStorage " + _tag);
            clearTimeout(storables[_tag].timeout);
            storables[_tag].timeout = undefined;
            storables[_tag].resolve();
          }, (_isForced ? 1 : 1000));
        }
      });

    }
  });


  Object.defineProperty(_common, "retrieveLocally", {
    configurable: false,
    enumerable: false,
    value: async function (givenTag, objectToPopulate) {
      return new Promise(function (resolve, reject) {
        if (!TheM.isBrowser) return resolve();
        if (!TheM.isLocalSavingAllowed) return resolve();

        if (!isiOS) { //normal device
          let randomId = TheM.common.GetRandomSTR(40);
          retrievables[randomId] = {
            resolve: resolve,
            objectToPopulate: objectToPopulate
          };
          let retrievable = {
            type: "retrieve",
            tag: TheM.config.LOCAL_STORAGE_TAG_PREFIX + givenTag,
            retrievableId: randomId
          }
          localStorageWorker.postMessage(retrievable);

        } else { //iOS workaround

          let compressed = window.localStorage.getItem(givenTag);
          if (!compressed || compressed.length < 1) {
            objectToPopulate = undefined;
            return resolve();
          };
          // console.log("loaded from the localstorage " + givenTag);
          let decompressed = LZString.decompressFromUTF16(compressed) || "";
          try {
            let parsed = JSON.parse(decompressed);
            if (objectToPopulate) {
              if (typeof parsed === "object") {
                for (const prop of Object.getOwnPropertyNames(objectToPopulate)) {
                  delete objectToPopulate[prop];
                }
                Object.assign(objectToPopulate, parsed);
              } else {
                objectToPopulate = parsed;
              }
            }
            return resolve(parsed);
          } catch (err) {
            console.error(err);
            return reject();
          }
        }
      });
    }
  });



  Object.defineProperty(_common, "fixDts", { //traverses given object and converts any string properties starting with "dts" into a Date type
    configurable: false,
    enumerable: false,
    value: function (given) {
      function hop(what) {
        for (let el in what)
          if (el.startsWith("dts") || el.startsWith("DTS")) {
            if (Object.getOwnPropertyDescriptor(what, el).set ||
              Object.getOwnPropertyDescriptor(what, el).writable)
              if (what[el] !== null) {
                what[el] = new Date(what[el]);
              } else {
                what[el] = undefined;
              }
          } else if (Array.isArray(what[el])) {
            hop(what[el]);
          } else if (typeof what[el] === "object") hop(what[el]);
      }
      hop(given);
    }
  });

  /**
   * seconds since last server call was made
   */
  Object.defineProperty(_common, "secsSinceLastCall", {
    get: function () {
      return parseInt(((new Date()) - _dtslastCall) / 1000);
    }
  });


  Object.defineProperty(_common, "backEndURL", {
    get: function () {
      return TheM.config.backEndURL;
    }
  });

  /**
   * number of ongoing requests to the server
   */
  Object.defineProperty(_common, "loading", {
    get: function () {
      return _loading;
    }
  });

  /**
   * list of ongoing requests to the server. For debugging purposes.
   */
  Object.defineProperty(_common, "loadingwhat", {
    get: function () {
      return _loadingwhat;
    }
  });

  Object.defineProperty(_common, "isAsyncOk", {
    set: function (given) {
      if (given === true || given === false) _isAsyncOk = given;
    },
    get: function () {
      return _isAsyncOk;
    }
  });


  if (!TheM.isBrowser && 2 === 3) {
    Object.defineProperty(_common, "doCall", { //node
      configurable: false,
      enumerable: false,
      value: function (RequestType, FunctionName, Payload, callback, errorcallback) {
        _loading++;
        let temp_dtslastCall = new Date();

        console.log("TheM: Doing a back-end call " + RequestType + " " + FunctionName);
        request({
          method: RequestType,
          uri: TheM.config.backEndURL + FunctionName,
          json: true,
          body: Payload,
          headers: {
            "token": _token
          }
        }, function (error, response, body) {
          _loading--;
          _dtslastCall = new Date(temp_dtslastCall);
          if (!error && response.statusCode == 200) {
            console.log("TheM: Back-end replied for " + FunctionName);
            callback(body);
          } else {
            //if (errorcallback) console.error("ERROR making a call to back-end", response);
            if (errorcallback) errorcallback(request.statusText); // error occurred
          }
        });
      }
    });
  };

  if (!TheM.isBrowser) {
    Object.defineProperty(_common, "doCall", { //node axios
      configurable: false,
      enumerable: false,
      value: function (requestType, functionName, payload, callback, errorcallback) {
        _loading++;
        let temp_dtslastCall = new Date();

        console.log("TheM: Doing a back-end call " + requestType + " " + functionName);


        let options = {
          method: requestType,
          url: TheM.config.backEndURL + functionName,
          data: payload
        };
        if (_token) options.headers = {
          "token": _token
        };

        axios(options).then(response => {
          _dtslastCall = new Date(temp_dtslastCall);
          if (response && response.status == 200) {
            console.log("TheM: Back-end replied for " + functionName);
            return callback(response.data);
          } else {
            console.error("ERROR making a call to back-end");
            if (errorcallback) errorcallback(response.statusText); // error occurred
          }
        }).catch(error => {
          console.error("FAILED making a call to back-end");
          console.error(error);
          if (errorcallback) errorcallback();

        }).then(() => {
          _loading--;

        });
 
      }
    });
  };


  if (TheM.isBrowser) {
    Object.defineProperty(_common, "doCall", { //browser
      configurable: false,
      enumerable: false,
      value: async function (RequestType, FunctionName, Payload, callback, errorcallback) {
        let temp = _common.GetRandomSTR(6) + "_" + FunctionName;
        try {
          _loadingwhat[temp] = temp;
          _loading++;

          const reqParams = {
            method: RequestType,
            mode: "cors",
            cache: "no-cache",
            headers: {
              "token": _token,
              "isasyncok": _isAsyncOk,
              "Content-type": "application/json;charset=UTF-8"
            }
          }
          if (RequestType.toUpperCase() !== "GET" && Payload) reqParams.body = JSON.stringify(Payload);

          const response = await fetch(TheM.config.backEndURL + FunctionName, reqParams);
          _dtslastCall = new Date();

          let responseJSON;
          if (response.status === 200) {
            responseJSON = await response.json();
            if (responseJSON.wrongToken) {
              TheM.newEvent("modelBank asked to logout");
              if (errorcallback) errorcallback({
                error: true
              }); // status is not 200 OK
            }
            delete _loadingwhat[temp];
            _loading--;
            if (callback) return callback(responseJSON);
            return (responseJSON);
          } else if (response.status === 401) {
            TheM.newEvent("modelBank asked to logout"); //not authorized
          }
          // status is not 200 OK
          if (errorcallback) return errorcallback({
            error: true
          });
          delete _loadingwhat[temp];
          _loading--;
          return {
            error: true
          }
        } catch (err) {
          console.error(err);
          delete _loadingwhat[temp];
          _loading--;
          if (errorcallback) return errorcallback({
            error: true
          });
        }
      }
    });
  };



  if (TheM.isBrowser) {
    Object.defineProperty(_common, "doCallAsync", {
      configurable: false,
      enumerable: false,
      value: function (RequestType, FunctionName, Payload) {
        return new Promise(async (resolve, reject) => {
          try {
            let temp = _common.GetRandomSTR(6) + "_" + FunctionName;
            _loadingwhat[temp] = temp;
            _loading++;

            const reqParams = {
              method: RequestType,
              mode: "cors",
              cache: "no-cache",
              headers: {
                "token": _token,
                "Content-type": "application/json;charset=UTF-8"
              }
            }
            if (RequestType.toUpperCase() !== "GET" && Payload) reqParams.body = JSON.stringify(Payload);

            const response = await fetch(TheM.config.backEndURL + FunctionName, reqParams);
            _dtslastCall = new Date();

            let responseJSON;
            if (response.status === 200) {
              responseJSON = await response.json();
              if (responseJSON.wrongToken) {
                TheM.newEvent("modelBank asked to logout");
                if (errorcallback) errorcallback({
                  error: true
                }); // status is not 200 OK
              }
              return resolve(responseJSON);
            } else if (response.status === 401) {
              TheM.newEvent("modelBank asked to logout"); //not authorized
            }
            // status is not 200 OK
            _loading--;
            delete _loadingwhat[temp];
            return reject({
              error: true
            });
          } catch (err) {
            console.error(err);
            return reject({
              error: true
            });
          }
        });
      }
    });
  };





  const handler = {
    get: function (_common, nameRequested) {
      return _common[nameRequested];
    },
    set: function (givenElement, index, value) {
      return ((_common[index] = value) || true);
    }
  };

  TheM.common = new Proxy(_common, handler);

  TheM.newEvent("TheM.common ready");
};
