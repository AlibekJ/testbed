"use strict";

console.time("indexedDB");

let request = indexedDB.open("modelBank", 2);
let db;
let isReady = false;
let queue = [];
let intervalStarter;

request.onerror = function (event) {
  //User has not given us permission to use the storage
  //TODO handle this
  console.error("Error opening indexedDB");
  console.error(event);
};

request.onsuccess = function (event) {
  db = event.target.result;
  isReady = true;
  console.log("indexedDB worker ready");
  console.timeEnd("indexedDB");
};

request.onupgradeneeded = function (event) {
  let db = event.target.result;
  let objectStore = db.createObjectStore("tags", { keyPath: "tag" });
};



let doProcessQueue = function () {
  if (!isReady) return;

  clearInterval(intervalStarter);

  let data = queue.shift();
  if (!data) return;

  if (data.type === "store") {
    let writerObjectStore = db.transaction("tags", "readwrite").objectStore("tags");
    let compressed = (data.payload ? LZString.compressToUTF16(JSON.stringify(data.payload)) : undefined);
    let encrypted = compressed; //TODO: implement encryption
    let request = writerObjectStore.put({
      tag: data.tag,
      payload: encrypted
    });

    request.onsuccess = function () { //acknowledge recording
      data.isSuccess = true;
      self.postMessage(data);
    };
    request.onerror = function (event) { //return nothing
      data.isError = true;
      self.postMessage(data);
    };

  } else if (data.type === "retrieve") {
    let objectStore = db.transaction("tags", "readonly").objectStore("tags");
    let request = objectStore.get(data.tag);
    request.onsuccess = function (event) {
      try {
        let compressed = event.target.result.payload;
        let uncompressed = (compressed ? LZString.decompressFromUTF16(compressed) : undefined);
        let decrypted = uncompressed; //TODO: implement decryption
        uncompressed = (decrypted ? JSON.parse(uncompressed) : undefined);
        data.payload = uncompressed;
      } catch (err) { } finally {
        self.postMessage(data);
      };
      request.onerror = ()=>{
        self.postMessage(data);
      };
    };
  };

  if (queue.length > 0) doProcessQueue();
};

 



self.addEventListener("message", function (e) {

  if (!e.data) return;

  if (e.data && e.data.isInit) {
    //TheM is sending the path to the lz-string lib
    importScripts(e.data.baseLibURL + "lz-string.min.js");
    return;
  };

  queue.push(e.data);

  if (isReady) {
    doProcessQueue();
  } else {
    if (!intervalStarter) intervalStarter = setInterval(doProcessQueue, 10);
  };

}, false);
 


 