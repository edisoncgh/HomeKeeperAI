const fs = require("node:fs");

function normalizeReadlinkError(error) {
  if (error && error.code === "EISDIR" && error.syscall === "readlink") {
    error.code = "EINVAL";
    error.message = error.message.replace("EISDIR", "EINVAL");
  }

  return error;
}

const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;
const originalPromisesReadlink = fs.promises.readlink.bind(fs.promises);

fs.readlink = function patchedReadlink(path, options, callback) {
  if (typeof options === "function") {
    return originalReadlink.call(fs, path, (error, linkString) => {
      options(normalizeReadlinkError(error), linkString);
    });
  }

  return originalReadlink.call(fs, path, options, (error, linkString) => {
    callback(normalizeReadlinkError(error), linkString);
  });
};

fs.readlinkSync = function patchedReadlinkSync(path, options) {
  try {
    return originalReadlinkSync.call(fs, path, options);
  } catch (error) {
    throw normalizeReadlinkError(error);
  }
};

fs.promises.readlink = async function patchedPromisesReadlink(path, options) {
  try {
    return await originalPromisesReadlink(path, options);
  } catch (error) {
    throw normalizeReadlinkError(error);
  }
};
