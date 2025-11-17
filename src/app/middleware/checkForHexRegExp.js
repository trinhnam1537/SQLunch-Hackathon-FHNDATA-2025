function checkForHexRegExp(id) {
  const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i
  return checkForHexRegExp.test(id)
}

module.exports = checkForHexRegExp