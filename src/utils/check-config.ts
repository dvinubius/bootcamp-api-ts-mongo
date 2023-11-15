export const checkConfig = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_COOKIE_EXPIRE',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'MAX_FILE_UPLOAD',
    'FILE_UPLOAD_PATH',
    'GEOCODER_PROVIDER',
    'GEOCODER_API_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USERNAME',
    'SMTP_PASSWORD',
    'FROM_NAME',
    'FROM_EMAIL',
  ];
  for (const v of requiredEnvVars) {
    if (!process.env[v]) {
      throw new Error(
        `${v} not found in config. Check the config/config.env file.`
      );
    }
  }
};
