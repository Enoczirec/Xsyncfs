const { exception } = require("console");

let buffer = {};
let disk = {};
let disk_buffer = {};
let speculator = {};
let prob = 90;

const nuke = () => {
  buffer = {};
  disk = {};
  disk_buffer = {};
  speculator = {};
  prob = 90;
};

const isSuccessful = () => {
  const odds = Math.floor(Math.random() * 101);
  return odds <= prob;
}

const setSuccessRate = (new_prob) => {
  if (new_prob != null && new_prob != '') {
    prob = new_prob;
  }
}

const getSuccessRate = () => {
  return prob;
}

const getPendingProcesses = (fileName) => {
  return Object.keys(speculator)
  .filter(key => speculator[key].fileName == fileName)
  .find(key => speculator[key].successful == false) || null;
}

const updateDiskBuffer = (bufferFileName = null, diskFileName = null) => {
  if (bufferFileName) {
    disk_buffer[bufferFileName] = Object.keys(buffer).filter(key => buffer[key].fileName == bufferFileName) || [];
  } else {
    disk_buffer[diskFileName] = [];
  }
}

const getSpeculator = () => {
  return speculator;
}

const getSpeculatorPreviousProcess = (fileName) => {
  return Object.keys(speculator).reverse().find(key => speculator[key].fileName == fileName) || null;
}

const saveToBuffer = (data, processId) => {
  const previousProcess = getSpeculatorPreviousProcess(data.fileName);
  const successful = isSuccessful();
  const commit_dependency = previousProcess && isFileInBuffer(data.fileName) ? previousProcess : null;
  speculator[processId] = { ...data, successful, processed:false, commit_dependency }
  if (successful == false) {
    return;
  }
  const pending = getPendingProcesses(data.fileName);
  if (!pending) {
    speculator[processId] = { ...speculator[processId], processed: true };
    buffer[processId] = { ...data };
    updateDiskBuffer(data.fileName);
  }
};

const getPreviousProcessProcessed = (fileName, processId) => {
  return Object.keys(speculator)
    .reverse()
    .find(key => speculator[key].fileName == fileName && speculator[key].processed && processId != key)
};

const updateSpeculator = (processId) => {
  const temp = speculator[processId];
  const successful = isSuccessful();
  if (successful) {
    buffer[processId] = temp;
    speculator[processId] = { ...temp, successful, processed: true };
    const fileName = temp.fileName;
    updateDiskBuffer(fileName);
    let speculatorAux = [];
    const speculatorFiles = Object.keys(speculator)
      .filter(key => speculator[key].fileName == fileName && !speculator[key].processed && speculator[key].action == 'write')
    try {
      speculatorFiles.forEach(key => {
        if (key != processId) {
          if (speculator[key].successful != false) {
            speculatorAux.push(key);
          } else {
            throw exception;
          }
        }
      });
    } catch (e) { }
    speculatorAux.forEach(key => {
      const fileName = speculator[key].fileName;
      buffer[key] = speculator[key];
      speculator[key] = { ...speculator[key], processed: true };
      const commit_dependency = getPreviousProcessProcessed(fileName, key)
      speculator[key] = { ...speculator[key], processed: true, commit_dependency };
      updateDiskBuffer(fileName);
    })
  }
};

const saveDurability = (data, processId) => {
  const commit_dependency = getSpeculatorPreviousProcess(data.fileName)
  speculator[processId] = { ...data, processed: false, commit_dependency };
  const pending = getPendingProcesses(data.fileName);
  if (!pending) {
    speculator[processId] = { ...data, processed: true };
    if (isFileInBuffer(data.fileName)) {
      getFile(data.fileName);
    }
    saveToDisk(data, processId);
  }
}

const saveToDisk = (data, processId) => {
  disk[data.fileName] = { ...data, processId }
  updateDiskBuffer(null, data.fileName);
}

const commitBufferToDisk = () => {
  const helper = {};
  const buffer_keys = Object.keys(buffer);
  if (buffer_keys.length) {
    buffer_keys.forEach(key => {
      const current_buffer = buffer[key] || null;
      if (current_buffer) {
        helper[current_buffer.fileName] = current_buffer;
      }
    });
    buffer = {};
    saveBufferToDisk(helper);
  }
}

const saveBufferToDisk = (data) => {
  Object.keys(data).forEach(key => {
    updateDiskBuffer(null, key);
  })
  Object.assign(disk, data);
}

const getBuffer = () => {
  return buffer;
}

const getBufferFile = (processId) => {
  return buffer[processId] || null;
}

const isFileInBuffer = (fileName) => {
  const file = Object.keys(buffer).find(key => buffer[key].fileName == fileName) || null;
  return file != null;
}

const getDisk = () => {
  return disk;
}

const getDiskFile = (fileName) => {
  return disk[fileName] || null;
}

const getDiskBufferByName = (fileName) => {
  return Object.keys(disk_buffer).find(key => key == fileName) || null;
}

const getFile = (fileName) => {
  const process_key = Math.floor(new Date().getTime())
  const pending = getPendingProcesses(fileName);
  if(pending) {
    speculator[process_key] = {fileName, readSuccess: false, action: 'read'};
    return "";
  }
  const current_object = getDiskBufferByName(fileName);
  if (current_object) {
    const objects_buffer = disk_buffer[current_object].length;
    if (objects_buffer) {
      disk_buffer[current_object].forEach(process => {
        let temp = getBufferFile(process);
        if (temp) {
          commitProcess(process);
        }
      })
    }
  }
  const file = getDiskFile(fileName);
  speculator[process_key] = {fileName, readSuccess: true, action: 'read'};
  return file;
}

const commitProcess = (processId) => {
  const process = buffer[processId] || null;
  if (process) {
    delete buffer[processId];
    saveToDisk(process, processId);
  }
}

const getDiskBuffer = () => {
  return disk_buffer;
}

module.exports = {
  saveToBuffer,
  getBuffer,
  commitBufferToDisk,
  getDisk,
  getDiskBuffer,
  getSpeculator,
  getFile,
  setSuccessRate,
  saveDurability,
  nuke,
  getSuccessRate,
  updateSpeculator,
};