


const isValidUUIDv4 = (id) => {
    return (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i).test(id);
}

const isValidCustomId = (id, startsWith) => {
    if (typeof id !== 'string' || typeof startsWith !== 'string') return false;
    if (id.length !== 15) return false;
    if (!id.startsWith(startsWith)) return false;
    const remaining = id.slice(startsWith.length);
    return /^[0-9]+$/.test(remaining) && remaining.length === (15 - startsWith.length);
}

const helpers = {
    isValidUUIDv4,
    isValidCustomId
}

export default helpers;