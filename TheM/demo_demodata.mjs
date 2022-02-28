
export async function doInit(TheM) {
  return new Promise(async (resolve, reject) => {

    let _demodata = [];
    let _dtsUpdated = 0;
    let _isWorking = false;
    let _isUpdateFailed = false;
    let _updateProm;
    let _dtsUpdateNext = new Date("1978-10-15");
    let _timeoutIsScheduledToSave = false;
    let _isReady = false; //module is ready only after having loaded the data from the local storage or after having it fetched from the server


    TheM.config.demodata = TheM.config.demodata || {};
    const _TTL_RETRY_MS = TheM.config.demodata.TTL_RETRY_MS || 30 * 1000;
    const _TTL_EXPIRE_MS = TheM.config.demodata.TTL_EXPIRE_MS || 60 * 1000;

    const dataClasses = await import(`${TheM.config.modulesFolder}demo_dataClasses.mjs`);




    Object.defineProperty(_demodata, "isReady", { //returns true if TheM.demodata is fully ready 
      enumerable: false,
      configurable: false,
      get: function (given) {
        return _isReady;
      },
      set: (given) => {
        if (given !== true && given !== false) return _isReady;
        if (given && !_isReady) TheM.newEvent("TheM.demodata ready");
        return _isReady = given
      }
    });

    Object.defineProperty(_demodata, "doSave", { //saves demodata in the local storage
      enumerable: false,
      configurable: false,
      value: function (given) {
        if (!TheM.user || !TheM.user.AWSMUserId) return false;
        if (!TheM.user.isAuthenticated) return false;

        if (_timeoutIsScheduledToSave) return true;

        _timeoutIsScheduledToSave = true;
        setTimeout(() => {
          let savable = {
            dtsUpdated: _dtsUpdated,
            dtsUpdateNext: _dtsUpdateNext,
            demodata: []
          };
          _demodata.map(el => savable.demodata.push(el.toJSON));
          TheM.common.storeLocally({
            tag: TheM.user.AWSMUserId + "demodata_v3",
            payload: given || savable
          });
          _timeoutIsScheduledToSave = false;
        }, 1000);

        return true;
      }
    });

    Object.defineProperty(_demodata, "doLoad", {
      enumerable: false,
      configurable: false,
      value: function () {
        return new Promise(async (resolve, reject) => {
          if (!TheM.user || !TheM.user.AWSMUserId) return resolve(false);
          if (!TheM.user.isAuthenticated) return resolve(false);

          try {

            let data = await TheM.common.retrieveLocally(TheM.user.AWSMUserId + "demodata_v3");
            if (!data) return;
            if (TheM.common.fixDts) TheM.common.fixDts(data);

            if (data.demodata && _dtsUpdated.valueOf() < data.dtsUpdated.valueOf()) {
              //if saved data is newer, use it
              _dtsUpdated = new Date(data.dtsUpdated);
              _demodata.doDigest(data.demodata);
            };

            _demodata.isReady = true;

            return resolve(true);

          } catch (err) {
            console.error("Failed loading demodata");
            console.error(err);
            return resolve(false);
          }

        });
      }
    });

    Object.defineProperty(_demodata, "doUpdate", { //GET request to fetch the list of demodata
      enumerable: false,
      configurable: false,
      value: function (givenParams) {
        if (givenParams === true) givenParams = {
          force: true
        };
        givenParams = givenParams || {};

        if (TheM && TheM.user && !TheM.user.isAuthenticated) return Promise.resolve();

        if (_isWorking && _updateProm && !givenParams.force) return _updateProm;

        _updateProm = new Promise((resolve, reject) => {

          if ((new Date()).valueOf() < _dtsUpdateNext.valueOf() && !givenParams.force) return resolve();
          _isWorking = true;
          let tempDts = new Date();

          TheM.common.doCall("GET", "demodata.json", {}, function (data) {

           
            TheM.common.fixDts(data);

            //now remove those demodata which are NOT present in the server's reply
            for (let ii = _demodata.length; ii--;) {
              let found = false;
              for (let i = data.demodata.length; i--;)
                if (_demodata[ii] && data.demodata[i] &&
                  _demodata[ii].AWSMDataId === data.demodata[i].AWSMDataId) found = true;
              if (!found) _demodata.splice(ii, 1);
            }

            _demodata.doDigest(data.demodata);
            _demodata.doSave();

            _dtsUpdated = new Date(tempDts);
            _dtsUpdateNext = (data.dtsUpdateNext ? new Date(data.dtsUpdateNext) : new Date(_dtsUpdated.valueOf() + _TTL_EXPIRE_MS));
            TheM.newEvent("demodata refreshed");
            _isWorking = false;
            _isUpdateFailed = false;
            _demodata.isReady = true;
            return resolve(data);
          },
            function (err) {
              _isUpdateFailed = true;
              _isWorking = false;
              _dtsUpdateNext = new Date((new Date()).valueOf() + _TTL_RETRY_MS);
              TheM.newEvent("demodata update failed");
              return reject();
            });

        });

        return _updateProm;
      }
    });

    Object.defineProperty(_demodata, "doDigest", {
      enumerable: false,
      configurable: false,
      value: function (givendemodata = []) {
        if (!Array.isArray(givendemodata)) givendemodata = [givendemodata];
        //check if demodata received already exist in the memory
        //if data piece is known, update its properties. If not, just add it
        TheM.common.fixDts(givendemodata);
        try {
          for (let i = 0; i < givendemodata.length; i++)
            if (givendemodata[i] && givendemodata[i].AWSMDataId) {
              let isFound = false;
              for (let ii = 0; ii < _demodata.length; ii++)
                if (givendemodata[i].AWSMDataId === _demodata[ii].AWSMDataId) {
                  isFound = true;
                  _demodata[ii].doDigest(givendemodata[i]);
                }
              if (!isFound) {
                let cl;
                if (givendemodata[i].typeId) cl = dataClasses.DATA_TYPE_ID_TO_CLASS[givendemodata[i].typeId];
                if (cl) { _demodata.push(new cl(givendemodata[i], TheM)); } else {
                  console.error("Unknown data type, so digesting it as a generic one", givendemodata[i]);
                  _demodata.push(new dataClasses.DATA_TYPE_ID_TO_CLASS.default(givendemodata[i], TheM));
                }
              }
            }
          //sort
          _demodata.sort((el1, el2) => {
            if (!el2.dtsOpened) return -1;
            if (!el1.dtsOpened) return 1;
            return el2.dtsOpened.valueOf() - el1.dtsOpened.valueOf()
          });
          _demodata.sort((el1, el2) => {
            if (el1.isMain) return -1;
            if (el2.isMain) return 1;
            return 0;
          });
          //now remove closed demodata
          for (let i = _demodata.length - 1; i >= 0; i--)
            if (_demodata[i].isClosed) _demodata.splice(i, 1);
        } catch (err) {
          console.error("ERROR digesting demodata", err);
        }


      }
    });

    Object.defineProperty(_demodata, "all", { //all not-closed and not-hidden
      configurable: false,
      enumerable: false,
      get: function () {
        return _demodata.filter(el => !el.isHidden && !el.isClosed);
      }
    });

    Object.defineProperty(_demodata, "filtered", {
      configurable: false,
      enumerable: false,
      value: function (givenParams) { //return all demodata which match all the given properties
        givenParams = givenParams || {};
        let resp = [];
        for (let el of _demodata) {
          let found = true;
          for (let param in givenParams)
            if (givenParams.hasOwnProperty(param) && el[param] != givenParams[param]) found = false;
          if (found) resp.push(el);
        }
        return resp;
      }
    });

      
 


 

    TheM.on(["demodata pushed"], data => { //server has sent a socket message 
      if (!data || !data.detail || !data.detail.payload || !data.detail.payload.demodata || data.detail.payload.demodata.length < 1) return undefined;
      _demodata.doDigest(data.detail.payload.demodata);
    });

     
    

    TheM.on("mobile app resume", () => {
      let a = (new Date()).valueOf();
      if (_dtsUpdateNext.valueOf() > a)
        _dtsUpdateNext = new Date(a + (_dtsUpdateNext.valueOf() - a) / 4);
    });

    TheM.on(["drop demodata data", "drop all data"], () => {
      _dtsUpdated = new Date("1978-10-15");
      _dtsUpdateNext = new Date("1978-10-15");
      while (_demodata.pop()) { };
      _demodata.doSave({});
    });

    

    TheM.on("logged in", () => {
      _demodata.doLoad()
      _demodata.doUpdate();
    });




    if (TheM.user && TheM.user.isAuthenticated) {
      _demodata.doLoad();
      _demodata.doUpdate();
    };



    const handler = {
      get: function (_demodata, nameRequested) {
        if (nameRequested != "isExpired" && nameRequested != "doUpdate" && nameRequested != "doDigest" && nameRequested != "doSave" && nameRequested != "doLoad") _demodata.doUpdate();

        for (let el of _demodata)
          if (el.AWSMDataId === nameRequested || el.num === nameRequested) return el;

        return _demodata[nameRequested];
      },
      set: function (givenElement, index, value) {
        return ((_demodata[index] = value) || true);
      }
    };


    TheM.demodata = new Proxy(_demodata, handler);





    return resolve(true);
  });
};