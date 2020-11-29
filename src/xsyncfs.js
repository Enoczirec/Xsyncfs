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
  if(new_prob != null && new_prob != '') {
    prob = new_prob;
  }
  console.log(prob);
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

const saveToBuffer = async (data, processId) => {
  const previousProcess = Object.keys(speculator).reverse().find(key => speculator[key].fileName == data.fileName)
  const successful = isSuccessful();
  const commit_dependency = previousProcess && isFileInBuffer(data.fileName) ? previousProcess: null;
  speculator[processId] = {...data, successful, commit_dependency }
  if (successful == false) {
    while(!isSuccessful());
  }
  speculator[processId] = {...data, successful:true, commit_dependency }
  buffer[processId] = { ...data };
  updateDiskBuffer(data.fileName);
};

const saveDurability = (data, processId) => {
  if(isFileInBuffer(data.fileName)) {
    getFile(data.fileName);
  }
  saveToDisk(data, processId);
}

const saveToDisk = (data, processId) => {
  disk[data.fileName] = {...data, processId}
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
  const file = Object.keys(buffer).find(key => buffer[key].fileName == fileName) || null;
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
  const current_object = getDiskBufferByName(fileName);
  if(current_object) {
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
  return getDiskFile(fileName);
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
};