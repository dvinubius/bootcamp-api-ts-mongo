import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { checkConfig } from '../utils/check-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: __dirname + '/config.env' });
checkConfig();
