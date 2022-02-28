console.log("TheM starting");

const _TheM = {};



class ClassTheM {
  constructor(given = {}) {
    let _TheM = this;
    let _loadingwhat = [];



    given.config = given.config || {};
    const _AWSMInstanceId = given.config.AWSMInstanceId || "awsm_instance0";
    const config = { ...given.config };
    config.version = "2.0.1";
    config.LOCAL_STORAGE_TAG_PREFIX = given.config.LOCAL_STORAGE_TAG_PREFIX || "test_";
    config.backEndURL = given.config.backEndURL;
    config.modulesFolder = given.config.modulesFolder || "./";
    config.baseLibURL = given.config.baseLibURL || "./lib/";
    config.defaultCurrency = given.config.defaultCurrency || "USD";



    let _eventEmitter;

    //is this a browser or is this a node.js enviroment
    let _isBrowser = false;
    if (typeof process !== 'undefined') { _isBrowser = false; } else { _isBrowser = true; }
    if (!_isBrowser) {
      import("events").then(events => {
        _eventEmitter = new events.EventEmitter();
      });
    }

    const _loading = [];



    let _isLocalSavingAllowed = true;



    Object.defineProperty(_TheM, "AWSMInstanceId", {
      configurable: false,
      enumerable: true,
      get: function () {
        return _AWSMInstanceId;
      }
    });


    Object.defineProperty(_TheM, "config", {
      enumerable: true,
      configurable: true,
      get: function () {
        return config;
      }
    });


    Object.defineProperty(_TheM, "isBrowser", {
      enumerable: false,
      configurable: false,
      get: function () {
        return _isBrowser;
      }
    });




    Object.defineProperty(_TheM, "doInit", {
      enumerable: true,
      configurable: false,
      value: async function (givenModuleNames) { //case sensitive space-separated string with names of modules which may be required during this session 
        givenModuleNames = givenModuleNames || "";
        givenModuleNames = givenModuleNames + " ";

        let proms = [];

        let moduleNames = givenModuleNames.split(" ");

        if (moduleNames.includes("common")) {
          let temp = await import(`${config.modulesFolder}demo_common.mjs`);
          await temp.doInit(_TheM);
        };

        for (let moduleName of moduleNames)
          if (moduleName && !_TheM[moduleName] && !_loading.includes(moduleName)) {
            _loading.push(moduleName);
            proms.push(import(`${config.modulesFolder}demo_${moduleName}.mjs`));
          };

        await Promise.allSettled(proms);

        let proms1 = [];
        for (let prom of proms) {
          let temp = await prom;
          if (temp.doInit) {
            let p = temp.doInit(_TheM);
            if (Object(p).constructor === Promise) proms1.push(p);
          }
        };

        await Promise.allSettled(proms1);

      }
    });

    Object.defineProperty(_TheM, "isLocalSavingAllowed", { //if false TheM will not save anything locally
      configurable: false,
      enumerable: false,
      get: function () {
        return _isLocalSavingAllowed;
      },
      set: function (given) {
        if (given !== true && given !== false) return _isLocalSavingAllowed;
        _isLocalSavingAllowed = given;
      }
    });


    /**
     * Returns a number of calls (to the server) currently in progress
     *
     * @returns {number}
     */
    Object.defineProperty(_TheM, "loading", {
      configurable: true,
      enumerable: false,
      get: function () {
        return _loadingwhat.length;
      },
      set: function (given) {
        // if (typeof given === "number") _loading = given;
        return _loadingwhat.length;
      }
    });

    /**
    * Returns an array of strings describing requests currently in progress
    *
    * @returns an array of strings  
    */
    Object.defineProperty(_TheM, "loadingwhat", {
      configurable: true,
      enumerable: false,
      get: function () {
        return _loadingwhat;
      },
      set: function (given) {
        _loadingwhat = given;
      }
    });

    Object.defineProperty(_TheM, "newEvent", {
      enumerable: true,
      configurable: false,
      value: function (givenEventName, payload) {
        if (_isBrowser) {
          if (givenEventName) console.log("EVENT: " + JSON.stringify(givenEventName)); //, " payload:" + JSON.stringify(payload || {}));
          document.dispatchEvent(new CustomEvent(givenEventName, {
            detail: payload
          }));
          document.dispatchEvent(new CustomEvent("some data refreshed"));
          if (payload && payload.text && _TheM.notificationsOnscreen)
            _TheM.notificationsOnscreen.add(payload);
        } else {
          if (givenEventName) console.log(`TheM EVENT:   ` + JSON.stringify(givenEventName)); //+ " payload:" + JSON.stringify(payload || {})
          if (givenEventName && _eventEmitter) _eventEmitter.emit(givenEventName, payload)
        }
      }
    });


    /**
     * Overridable function which can be used as part of a rendering process if needed.
     * 
     */
    _TheM.refresh = function (givenEventName, payload) {
      _TheM.newEvent(givenEventName, payload);
      return true;
    }




    /**
     * @param {string} givenEventName   -- can be string or array of strings
     * @param {function} givenFunction   -- a callback function to call when the event occures  
     * @param {boolean} givenFlag   -- useCapture. If true, the event will be dispatched before affecting the DOM   
     * 
     * Registers a listener to the given event hame
     * 
     * Returns true in any case
     */
    Object.defineProperty(_TheM, "on", {
      configurable: false,
      enumerable: false,
      value: function (givenEventName, givenFunction, givenFlag) {
        if (givenFlag !== true && givenFlag !== false) givenFlag = false;
        let eventNames = [];
        if (typeof givenEventName === "string") eventNames.push(givenEventName);
        if (Array.isArray(givenEventName)) eventNames.push(...givenEventName);

        if (_isBrowser) {
          for (let eventName of eventNames)
            document.addEventListener(eventName, givenFunction, givenFlag);
        } else {
          for (let eventName of eventNames)
            _eventEmitter.on(eventName, givenFunction);
        };
        return true;
      }
    });





    const handler = {
      get: function (target, nameRequested) {
        // if (!_TheM[nameRequested]) _TheM.doInit(nameRequested); //if an unknown property was requested, most likely it is a module which they forgot to init.
        return _TheM[nameRequested];
      },
      set: function (givenElement, index, value) {
        return ((_TheM[index] = value) || true);
      }
    };


    _TheM.newEvent("TheM ready");
    _TheM.isReady = true;

    return new Proxy(_TheM, handler);
  }
};









export default ClassTheM;
