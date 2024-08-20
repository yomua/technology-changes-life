// Ref: https://docs.hamibot.com/reference/storages#storage-contains-key

(function () {
  function Store() {
    const storageName = "yomua_play_music";

    this.storage = storages.create(storageName);

    this.allKeyName = [];
  }

  Store.prototype.put = function (key, value) {
    if (!key) {
      throw new Error("Store: key 不能为空");
    }
    if (value === undefined) {
      throw new Error("Store: 不允许存储 undefined");
    }

    try {
      JSON.stringify(value);
    } catch (error) {
      throw new Error("Store: 不允许存储无法序列化成 JSON 的值");
    }

    this.storage.put(key, value);

    // 存储所有 key 的名字
    this.allKeyName.push(key);
    this.storage.put("allKeyName", this.allKeyName);
  };

  Store.prototype.get = function (key) {
    return this.storage.get(key);
  };

  // 只有当 put 的 key, 才会被记录
  Store.prototype.getAllValue = function () {
    const allKeyArr = this.storage.get("allKeyName") || [];
    const result = {};

    allKeyArr.forEach((key) => {
      result[key] = this.storage.get(key);
    });

    return result;
  };

  Store.prototype.remove = function (key) {
    this.storage.remove(key);
  };

  Store.prototype.clear = function () {
    this.storage.clear();
  };

  Store.prototype.contains = function (key) {
    return this.storage.contains(key);
  };

  const store = new Store();

  module.exports = store;
})();
