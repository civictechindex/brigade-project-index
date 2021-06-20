
// configure default logger
const logger = require('winston');
logger.add(new logger.transports.Console({
    level: process.env.DEBUG ? 'debug' : 'info',
    format: logger.format.combine(
        logger.format.colorize(),
        logger.format.simple()
    ),
}));

