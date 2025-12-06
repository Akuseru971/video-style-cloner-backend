import Creatomate from 'creatomate';

const client = new Creatomate.Client({
  apiKey: process.env.CREATOMATE_API_KEY || '',
});

export default client;
