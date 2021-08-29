exports.predictV2 = (_fastestPool, _fastPool, _standardPool, _safePool, _rec) => {
  _fastestPool.sort((a, b) => a - b)
  _fastPool.sort((a, b) => a - b)
  _standardPool.sort((a, b) => a - b)
  _safePool.sort((a, b) => a - b)

  let _fastestRec = _fastestPool.length > 0 ? _fastestPool[Math.floor(_fastestPool.length / 4)] : _rec.fastest
  let _fastRec = _fastPool.length > 0 ? _fastPool[Math.floor(_fastPool.length / 4)] : _rec.fast
  let _standardRec = _standardPool.length > 0 ? _standardPool[Math.floor(_standardPool.length / 4)] : _rec.standard
  const _safeRec = _safePool.length > 0 ? _safePool[Math.floor(_safePool.length / 4)] : _rec.safeLow

  _standardRec = _standardRec > _safeRec ? _standardRec : _safeRec
  _fastRec = _fastRec > _standardRec ? _fastRec : _standardRec
  _fastestRec = _fastestRec > _fastRec ? _fastestRec : _fastRec

  _rec.updateGasPrices(_safeRec, _standardRec, _fastRec, _fastestRec)
}
