import videoIntelligence from '@google-cloud/video-intelligence';

const client = new videoIntelligence.VideoIntelligenceServiceClient({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default client;
