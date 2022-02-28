"use strict";
import ClassTheM from "../TheM/demo.mjs";

TheM = new ClassTheM({
  config: {
    AWSMInstanceId: "qwe",
    backEndURL: "http://localhost:8083/",
    modulesFolder: "/TheM/",
    baseLibURL: "../lib/",
    user: {
      DEFAULT_HOMECOUNTRY: "US"
    }
  }
});



(async () => {
  


  await TheM.doInit("common demodata statics");

  await TheM.demodata.doUpdate();

  console.log(TheM.demodata);

  await TheM.statics.doUpdate("foobar");

  console.log(TheM.statics.foobar);


})();

