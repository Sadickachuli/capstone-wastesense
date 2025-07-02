import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL for production (Render) or individual vars for development
const dbConfig = process.env.DATABASE_URL 
  ? {
      client: 'pg',
      connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      },
      pool: {
        min: 2,
        max: 10,
      },
      migrations: {
        directory: './migrations',
        extension: 'ts',
      },
      seeds: {
        directory: './seeds',
        extension: 'ts',
      },
    }
  : {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'wastesense',
      },
      pool: {
        min: 2,
        max: 10,
      },
      migrations: {
        directory: './migrations',
        extension: 'ts',
      },
      seeds: {
        directory: './seeds',
        extension: 'ts',
      },
    };

export const db = knex(dbConfig); 