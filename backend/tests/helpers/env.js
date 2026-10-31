'use strict';
// Runs before every test file, before any app module reads process.env.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/unused-in-tests';
process.env.DRIVER_SEARCH_RADIUS_KM = '5';
