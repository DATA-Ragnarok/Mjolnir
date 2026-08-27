import { Router, Request, Response } from 'express';
import { OpenApiService } from '../services/OpenApiService.js';

const router = Router();

const getBaseServerUrl = (req: Request): string => {
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'mjolnir-dev-server.onrender.com';
  return `${protocol}://${host}`;
};

// GET /openapi.json and /api/openapi.json
router.get(['/openapi.json', '/openapi'], (req: Request, res: Response) => {
  const baseUrl = getBaseServerUrl(req);
  const spec = OpenApiService.getSpec(baseUrl);
  res.setHeader('Content-Type', 'application/json');
  res.json(spec);
});

// GET /openapi.yaml and /api/openapi.yaml
router.get(['/openapi.yaml', '/openapi.yml'], (req: Request, res: Response) => {
  const baseUrl = getBaseServerUrl(req);
  const spec = OpenApiService.getSpec(baseUrl);
  const yaml = OpenApiService.toYaml(spec);
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml);
});

export default router;
