import fs from 'fs';
import path from 'path';
import { readYamlEnvSync, readYamlEnv } from 'yaml-env-defaults';
import yaml from 'js-yaml';

const cfgPath = path.join(__dirname, '../fdroid/config.yml');
const config = readYamlEnvSync(cfgPath);
fs.writeFileSync(cfgPath, yaml.dump(config));