import geocoder from 'node-geocoder';

const provider = process.env.GEOCODER_PROVIDER;
const apiKey = process.env.GEOCODER_API_KEY;

const options = {
  provider: provider as geocoder.Providers,
  apiKey,
  formatter: null, // 'gpx', 'string', ...
};

export default geocoder(options);
