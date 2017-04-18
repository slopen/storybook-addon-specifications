import addons from '@kadira/storybook-addons';
import { EVENT_ID } from './';

let currentStory = "";
let asyncRows = [];

const results = {};
const beforeEachFunc = {};
const afterFunc = {};
const afterEachFunc = {};

const ASYNC_TIMEOUT = 10000;

export function specs (specs) {
  let storyName = specs ();
  const channel = addons.getChannel ();

  if (asyncRows.length) {

    channel.emit (EVENT_ID, {
      results: results [storyName]
    });

    Promise.all (asyncRows)
      .then (() => asyncRows = []);

    asyncRows.forEach ((item) =>
        item.then (() => channel.emit (EVENT_ID, {
          results: results [storyName]
        }))
    );

  } else {

    channel.emit (EVENT_ID, {
      results: results [storyName]
    });

  }
}

export const describe = (storyName, func) => {
  currentStory = storyName;

  results [currentStory] = {
    goodResults: [],
    wrongResults: []
  };

  func ();

  if (afterFunc [currentStory]) {
    afterFunc [currentStory] ();
  }

  return storyName;
};

const updateResults = (desc, e) => {
  if (e) {
    console.error(`${currentStory} - ${desc} : ${e.message || e}`);

    results [currentStory].wrongResults.push ({
      spec: desc,
      message: e.message
    });
  } else {
    results [currentStory].goodResults.push (desc);

    if (afterEachFunc [currentStory]) {
      afterEachFunc [currentStory] ();
    }
  }
}

export const it = function (desc, func) {
  if (beforeEachFunc [currentStory]) {
    beforeEachFunc [currentStory] ();
  }

  if (func.length) {
    asyncRows.push (
      new Promise ((resolve) => {
        let timeout = false;

        let t = setTimeout (() => {
          timeout = true;

          updateResults (desc, {
            message: `${ASYNC_TIMEOUT}ms timeout`
          });

          resolve ();

        }, ASYNC_TIMEOUT);

        func ((e) => {
          clearTimeout (t);
          updateResults (desc, e);

          if (!timeout) {
            resolve ();
          }
        });
      })
        .catch ((e) => updateResults (desc, e))
    );

  } else {
    let e = null;

    try {
      func ();
    } catch (err) {
      e = err;
    }

    updateResults (desc, e);
  }
};

export const before = function(func) {
  func()
};

export const beforeEach = function(func) {
  beforeEachFunc[currentStory] =  func;
};

export const after = function(func) {
  afterFunc[currentStory] =  func;
};

export const afterEach = function(func) {
  afterEachFunc[currentStory] =  func;
};

export const fit = function (desc, func) {
  it(desc, func)
};

export const xit = function (desc, func) {

};

export const xdescribe = function (storyName, func){
  currentStory = storyName;
  results[currentStory] = {
    goodResults: [],
    wrongResults: []
  };
  return storyName;
};

describe.skip = function (storyName, func){
  currentStory = storyName;
  results[currentStory] = {
    goodResults: [],
    wrongResults: []
  };
  return storyName;
};

it.only = function (desc, func) {
  it(desc, func);
};

it.skip = function (desc, func) {

};

describe.only = function (storyName, func) {
  return describe(storyName, func)
};

export const fdescribe = function (storyName, func) {
  return describe(storyName, func)
};
