var qrsInteract = require('qrs-interact');
var winston = require('winston');
var config = require('config');
var later = require('later');


// Set up Winston logger, logging both to console and different disk files
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            name: 'console_log',
            'timestamp': true,
            'colorize': true
        }),
        new (winston.transports.File)({
            name: 'file_info',
            filename: config.get('Logging.logDirectory') + '/info.log',
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'file_verbose',
            filename: config.get('Logging.logDirectory') + '/verbose.log',
            level: 'verbose'
        }),
        new (winston.transports.File)({
            name: 'file_error',
            filename: config.get('Logging.logDirectory') + '/error.log',
            level: 'error'
        })
    ]
});



// Set default log level
logger.transports.console_log.level = config.get('Logging.defaultLogLevel');
logger.log('info', 'Starting Qlik Sense UDC syncer.');



// Set up Sense repository service configuration
var configQRS = {
    hostname: config.get('QRS.host'),
    certificates: {
        certFile: config.get('QRS.clientCertPath'),
        keyFile: config.get('QRS.clientCertKeyPath')
    }
}



function syncUDC(udcGUID) {
    logger.log('verbose', 'Starting sync of UDC ' + udcGUID);
    
    configQRS.headers = { 'X-Qlik-User': 'UserDirectory=Internal; UserId=sa_repository' };
    logger.log('verbose', configQRS);

    var qrsInteractInstance = new qrsInteract(configQRS);

    var udc = [];
    udc[0] = '"{' + 

    qrsInteractInstance.Post('/userdirectoryconnector/syncuserdirectories', '[{' + config.get('QRS.udcGUID') + '}]', 'json')
    .then(result => {
            logger.log('debug', 'result=' + result);
        })
        .catch(err => {
            // Return error msg
            logger.log('error', 'Sync UDC: ' + err);
        })
}



var sched = later.parse.text('every 10 seconds');
var t = later.setInterval(function() {syncUDC(config.get('QRS.udcGUID'))}, sched);



