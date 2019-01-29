exports.encode = data => JSON.stringify(data);

exports.decode = buffer => JSON.parse(
  buffer.toString()
);

exports.log = (...args) => console.log(...args);


