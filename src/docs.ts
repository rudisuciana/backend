import path from 'path';
import YAML from 'yamljs';

export const loadOpenApiDocument = (): object => {
  const docPath = path.resolve(process.cwd(), 'docs', 'openapi.yaml');
  return YAML.load(docPath);
};
