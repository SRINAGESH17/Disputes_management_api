
/**
 * Enum-like object containing supported payment gateway identifiers.
 * @readonly
 * @enum {string}
 */

/**
 * Array of all supported payment gateway names.
 * @type {string[]}
 */

// Gateways
const Gateways = {
    RAZORPAY: 'razorpay',
    CASHFREE: 'cashfree',
    PAYU:'payu',
    STRIPE:'stripe',
    phonepe:'phonepe'
};

// Names
const GatewayNames = Object.values(Gateways);

export {
    Gateways,
    GatewayNames
}
