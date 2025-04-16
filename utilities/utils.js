/**
 * @param {string} pathname 
 * @param {number} index
 */
function getPathSegment(pathname, index) {
    return pathname.split('/').filter(x => !!x)[index] || '';
}

/**
 * @param {number} lat 
 * @param {number} long 
 * @param {number} elev in KM
 */
function validateQth(lat, long, elev) {
    const latValid = lat >= -90 && lat <= 90;
    const longValid = long >= -180 && long <= 180;
    const elevValid = elev < 26;

    return (latValid && longValid && elevValid);
}

function validateDuration(startTime, endTime) {
    const s = startTime === 'now' ? Date.now() : Number(startTime);
    const e = Number(endTime);

    return (e > s && e - s < ONE_HOUR);
}

/**
 * @param {(number | string)[]} param0 
 */
function normalizeQth([lat, long, elev]) {
    return [Number(lat).toFixed(2), Number(long).toFixed(2), Number(elev).toFixed(1)];
}

const ONE_HOUR = 1000 * 60 * 60;
const HOURS_72 = ONE_HOUR * 72;
const THREE_MINUTES = 1000 * 60 * 3;
const POINTING_INTERVAL = 4000;

module.exports = {
    getPathSegment,
    validateQth,
    validateDuration,
    normalizeQth,
    HOURS_72,
    ONE_HOUR,
    THREE_MINUTES,
    POINTING_INTERVAL,
};
