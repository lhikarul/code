// 2.2.7.1 -> 若 onFulfilled or onRejected 返回一個值 x，則運行 Promise.resove
// 2.2.7.2 ->  若 onFulfilled or onRejected 拋出異常 -> promise2 拒絕執行，並返回拒絕的原因
// 2.3.1 -> 若 promise 和 x 為同一個物件，以 TypeError 為原因拒絕執行 promise
class myPromise {
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";
  static resolve = (value) => {
    return new myPromise((resolve) => {
      resolve(value);
    });
  };

  static reject = (value) => {
    return new myPromise((resolve, reject) => {
      reject(value);
    });
  };

  constructor(func) {
    this.PromiseState = myPromise.PENDING;
    this.PromiseResult = null;
    this.onFullfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    try {
      func(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }
  resolve(result) {
    if (this.PromiseState === myPromise.PENDING) {
      setTimeout(() => {
        this.PromiseState = myPromise.FULFILLED;
        this.PromiseResult = result;
        this.onFullfilledCallbacks.forEach((callback) => callback(result));
      });
    }
  }
  reject(reason) {
    if (this.PromiseState === myPromise.PENDING) {
      setTimeout(() => {
        this.PromiseState = myPromise.REJECTED;
        this.PromiseResult = reason;
        this.onRejectedCallbacks.forEach((callback) => callback(reason));
      });
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          };

    // 2.2.7
    const promise2 = new myPromise((resolve, reject) => {
      if (this.PromiseState === myPromise.PENDING) {
        this.onFullfilledCallbacks.push(() => {
          try {
            let x = onFulfilled(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });

        this.onRejectedCallbacks.push(() => {
          try {
            let x = onRejected(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      if (this.PromiseState === myPromise.FULFILLED) {
        setTimeout(() => {
          // 2.2.7.1
          try {
            let x = onFulfilled(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            // 2.2.7.2
            reject(e);
          }
        });
      }

      if (this.PromiseState === myPromise.REJECTED) {
        setTimeout(() => {
          // 2.2.7.1
          try {
            let x = onRejected(this.PromiseResult);
            resolve(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }
    });

    return promise2;
  }
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
  finally(callback) {
    return this.then(callback, callback);
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  // // 2.3.1
  if (x === promise2) {
    console.log(new TypeError("haining cycle detected for promise"));
    return reject(new TypeError("Chaining cycle detected for promise"));
  }
  // 2.3.2  如果 x 为 Promise ，则使 promise 接受 x 的状态
  if (x instanceof myPromise) {
    if (x.PromiseState === myPromise.PENDING) {
      x.then((result) => {
        resolvePromise(promise2, result, resolve, reject);
      }, reject);
    } else if (x.PromiseState === myPromise.FULFILLED) {
      resolve(x.PromiseResult);
    } else if (x.PromiseState === myPromise.REJECTED) {
      reject(x.PromiseResult);
    }
  } else if (x !== null && (typeof x === "object" || typeof x === "function")) {
    try {
      var then = x.then;
    } catch (e) {
      return reject(e);
    }
    if (typeof then === "function") {
      let called = false;
      try {
        then.call(
          x,
          (result) => {
            if (called) return;
            called = true;
            resolvePromise(promise2, result, resolve, reject);
          },
          (reason) => {
            if (called) return;
            called = true;
            reject(reason);
          }
        );
      } catch (e) {
        if (called) return;
        called = true;
        reject(e);
      }
    } else {
      resolve(x);
    }
  } else {
    // 2.3.4 如果 x 不为对象或者函数，以 x 为参数执行 promise
    return resolve(x);
  }
}

// myPromise.deferred = function () {
//   let result = {};
//   result.promise = new myPromise((resolve, reject) => {
//     result.resolve = resolve;
//     result.reject = reject;
//   });
//   return result;
// };

// module.exports = myPromise;

let p1 = new myPromise(function (resolve, reject) {
  resolve(1);
})
  // .then(function (value) {
  //   console.log(value);
  // })
  // .catch(function (e) {
  //   console.log(e);
  // })
  .finally(function () {
    console.log("finanlly");
  });
