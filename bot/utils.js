const { Worker } = require("worker_threads");

function startWorker(path, cb) {
  let w = new Worker(path, { workerData: null });
  w.on("message", (msg) => {
    console.log("Worker: ", msg);
    cb(null, msg);
  });
  w.on("error", cb);
  w.on("exit", (code) => {
    if (code != 0)
      console.error(new Error(`Worker stopped with exit code ${code}`));
  });
  return w;
}

const getUserInfo = ({ username, first_name, id }) => {
  if (username) return username;

  if (first_name) return `${first_name} (${id})`;

  return id;
};

module.exports = { startWorker, getUserInfo };
