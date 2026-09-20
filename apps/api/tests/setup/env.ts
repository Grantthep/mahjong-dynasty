import { getTestDatabaseUrl } from './testDb';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.WEB_ORIGIN = 'http://localhost:5173';
process.env.BCRYPT_ROUNDS = '4';
