// src/utils/serialization.js
export const applyBigIntPatch = () => {
  // Ini memaksa Javascript mengubah BigInt jadi String saat dijadikan JSON
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
};